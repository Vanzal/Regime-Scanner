import robotsParser from 'robots-parser'

export interface PoliteStats {
  requests: number
  robots_lookups: number
  robots_blocked: number
  budget_blocked: number
  size_blocked: number
  cache_hits: number
  errors: number
}

export interface PoliteResponse {
  status: number
  headers: Record<string, string>
  body: string | null
  note?: 'too_large' | 'error' | 'js_required'
}

export type PoliteFetch = (url: string, init: RequestInit) => Promise<Response>

export const USER_AGENT =
  'NexusScopeBot/0.1 (+https://nexusscope.example/ueber; berichte@nexusscope.example)'

interface PolitenessOptions {
  budget?: number
  minDelayMs?: number
  timeoutMs?: number
  maxBytes?: number
  fetchImpl?: PoliteFetch
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Höflichkeits-Gate pro Scan – die harte Grenze des Produkts. Alle HTTP-
 * Aufrufe gegen das Ziel laufen hier durch; einzig robots.txt selbst wird
 * separat (und separat gezählt) geladen. Garantien, unit-getestet:
 * robots.txt disallow wird respektiert · ≥ minDelay zwischen Requests ·
 * Budget pro Scan · ausschließlich GET · Body-Größenlimit · Timeout ·
 * identische URLs werdenMemoisiert.
 */
export class Politeness {
  readonly stats: PoliteStats = {
    requests: 0,
    robots_lookups: 0,
    robots_blocked: 0,
    budget_blocked: 0,
    size_blocked: 0,
    cache_hits: 0,
    errors: 0,
  }

  private readonly budget: number
  private readonly minDelayMs: number
  private readonly timeoutMs: number
  private readonly maxBytes: number
  private readonly fetchImpl: PoliteFetch
  private readonly robotsCache = new Map<string, ReturnType<typeof robotsParser> | null>()
  private readonly responseCache = new Map<string, PoliteResponse>()
  private lastRequestAt = 0
  private spent = 0

  constructor(opts: PolitenessOptions = {}) {
    this.budget = opts.budget ?? 30
    this.minDelayMs = opts.minDelayMs ?? 750
    this.timeoutMs = opts.timeoutMs ?? 10_000
    this.maxBytes = opts.maxBytes ?? 2 * 1024 * 1024
    this.fetchImpl = opts.fetchImpl ?? ((url, init) => fetch(url, init))
  }

  /** robots.txt respektieren; fehlt/fehlerhaft → erlaubt (per RFC 9309). */
  async allowed(url: URL): Promise<boolean> {
    const origin = url.origin
    if (!this.robotsCache.has(origin)) {
      this.stats.robots_lookups++
      try {
        const res = await this.fetchImpl(`${origin}/robots.txt`, {
          method: 'GET',
          headers: { 'user-agent': USER_AGENT },
          signal: AbortSignal.timeout(this.timeoutMs),
        })
        const txt = res.ok ? await res.text() : ''
        this.robotsCache.set(origin, robotsParser(`${origin}/robots.txt`, txt))
      } catch {
        this.robotsCache.set(origin, robotsParser(`${origin}/robots.txt`, ''))
      }
    }
    const robots = this.robotsCache.get(origin) ?? null
    if (!robots) return true
    const verdict = robots.isAllowed(url.href, USER_AGENT)
    return verdict !== false // undefined (keine Regel) → erlaubt
  }

  /**
   * Höflicher GET. GET-only wird doppelt abgesichert: die API hat gar keinen
   * method-Parameter, und ein Manipulationsversuch des init-Objekts wirft.
   * Nicht erfüllbare Bedingungen (robots, Budget, Größe) liefern `null` bzw.
   * eine note – kein Stillbruch des Scans.
   */
  async get(url: string | URL, init?: { headers?: Record<string, string> }): Promise<PoliteResponse | null> {
    const target = new URL(url instanceof URL ? url.href : url)
    if (init && 'method' in init && (init as { method: string }).method.toUpperCase() !== 'GET') {
      throw new Error('Politeness.get: nur GET erlaubt (Scan läuft authentifizierungsfrei und passiv)')
    }

    if (!(await this.allowed(target))) {
      this.stats.robots_blocked++
      return null
    }
    if (this.spent >= this.budget) {
      this.stats.budget_blocked++
      return null
    }

    const cached = this.responseCache.get(target.href)
    if (cached) {
      this.stats.cache_hits++
      return cached
    }

    const wait = this.lastRequestAt + this.minDelayMs - Date.now()
    if (wait > 0) await sleep(wait)
    this.lastRequestAt = Date.now()

    let res: Response
    try {
      res = await this.fetchImpl(target.href, {
        method: 'GET',
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,text/plain,*/*', ...(init?.headers ?? {}) },
        signal: AbortSignal.timeout(this.timeoutMs),
        redirect: 'follow',
      })
    } catch {
      this.stats.errors++
      const err: PoliteResponse = { status: 0, headers: {}, body: null, note: 'error' }
      this.responseCache.set(target.href, err)
      return err
    }

    this.spent++
    this.stats.requests++

    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v
    })

    const contentLength = Number(headers['content-length'] ?? 0)
    if (contentLength > this.maxBytes) {
      this.stats.size_blocked++
      const blocked: PoliteResponse = { status: res.status, headers, body: null, note: 'too_large' }
      this.responseCache.set(target.href, blocked)
      return blocked
    }

    // Stream mit harter Größenkappe lesen (Content-Length kann fehlen/lügen)
    let body: string | null = null
    try {
      if (res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8', { fatal: false })
        let received = 0
        let text = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          received += value.byteLength
          if (received > this.maxBytes) {
            reader.cancel().catch(() => {})
            this.stats.size_blocked++
            const blocked: PoliteResponse = { status: res.status, headers, body: null, note: 'too_large' }
            this.responseCache.set(target.href, blocked)
            return blocked
          }
          text += decoder.decode(value, { stream: true })
        }
        body = text + decoder.decode()
      }
    } catch {
      this.stats.errors++
    }

    const out: PoliteResponse = { status: res.status, headers, body }
    this.responseCache.set(target.href, out)
    return out
  }
}
