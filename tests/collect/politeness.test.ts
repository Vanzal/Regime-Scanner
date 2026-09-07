import { describe, expect, it } from 'vitest'
import { Politeness, USER_AGENT } from '@/lib/collect/politeness'

/** Fake-Fetch: zeichnet Aufrufe auf, antwortet über eine Handler-Tabelle. */
function fakeFetch(
  handler: (url: string, init: RequestInit) => { status?: number; body?: string; headers?: Record<string, string> } | 'hang',
) {
  const calls: Array<{ url: string; headers: Record<string, string>; at: number }> = []
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, headers: (init.headers ?? {}) as Record<string, string>, at: Date.now() })
    const res = handler(url, init)
    if (res === 'hang') {
      // das AbortSignal respektieren – sonst endet der Test nie
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('signal aborted')))
      })
    }
    return new Response(res.body ?? '', {
      status: res.status ?? 200,
      headers: res.headers,
    })
  }
  return { calls, impl }
}

const OK = { status: 200, body: 'ok' }

describe('Politeness-Gate (harte Grenzen der Sammlung)', () => {
  it('respektiert robots.txt disallow und ruft die Seite nicht ab', async () => {
    const { calls, impl } = fakeFetch((url) => (url.endsWith('/robots.txt') ? { body: 'User-agent: *\nDisallow: /privat\n' } : OK))
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0 })

    expect(await gate.get('https://example.com/privat/x')).toBeNull()
    expect(gate.stats.robots_blocked).toBe(1)
    expect(calls.filter((c) => !c.url.includes('robots.txt'))).toHaveLength(0)

    expect(await gate.get('https://example.com/offen')).not.toBeNull()
  })

  it('hält den Mindestabstand zwischen Requests ein', async () => {
    const { calls, impl } = fakeFetch(() => OK)
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 60, budget: 10 })

    await gate.get('https://example.com/a')
    await gate.get('https://example.com/b')
    await gate.get('https://example.com/c')

    const contentCalls = calls.filter((c) => !c.url.includes('robots.txt'))
    expect(contentCalls).toHaveLength(3)
    expect(contentCalls[1].at - contentCalls[0].at).toBeGreaterThanOrEqual(55)
    expect(contentCalls[2].at - contentCalls[1].at).toBeGreaterThanOrEqual(55)
  })

  it('hält das Request-Budget ein', async () => {
    const { calls, impl } = fakeFetch(() => OK)
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0, budget: 2 })

    expect(await gate.get('https://example.com/1')).not.toBeNull()
    expect(await gate.get('https://example.com/2')).not.toBeNull()
    expect(await gate.get('https://example.com/3')).toBeNull()
    expect(gate.stats.budget_blocked).toBe(1)
    expect(calls.filter((c) => !c.url.includes('robots.txt'))).toHaveLength(2)
  })

  it('ist strikt GET-only (Manipulationsversuch wirft)', async () => {
    const { calls, impl } = fakeFetch(() => OK)
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0 })

    // regulärer Aufruf (kein method-Parameter) funktioniert
    await expect(gate.get('https://example.com/x')).resolves.not.toBeNull()
    expect(calls.filter((c) => !c.url.includes('robots.txt')).every((c) => c.url.startsWith('https://example.com/x'))).toBe(true)

    // ein geschmuggelter POST wird hart abgewiesen
    await expect(
      (gate.get as unknown as (u: string, i: { method: string }) => Promise<unknown>)('https://example.com/x', { method: 'POST' }),
    ).rejects.toThrow(/GET/)
  })

  it('sendet den Bot-User-Agent und folgt GET-Only-Konvention', async () => {
    const { calls, impl } = fakeFetch(() => OK)
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0 })
    await gate.get('https://example.com/seite')
    const page = calls.find((c) => !c.url.includes('robots.txt'))!
    expect(page.headers['user-agent']).toBe(USER_AGENT)
  })

  it('memoisiert identische URLs (kein Doppelfetch)', async () => {
    const { calls, impl } = fakeFetch(() => OK)
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0, budget: 10 })

    const first = await gate.get('https://example.com/gleich')
    const second = await gate.get('https://example.com/gleich')
    expect(second).toEqual(first)
    expect(gate.stats.cache_hits).toBe(1)
    expect(calls.filter((c) => !c.url.includes('robots.txt'))).toHaveLength(1)
  })

  it('kappt Bodies über dem Größenlimit und markiert too_large', async () => {
    const big = 'x'.repeat(3 * 1024 * 1024)
    const { impl } = fakeFetch(() => ({ status: 200, body: big, headers: { 'content-length': String(big.length) } }))
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0, maxBytes: 1024 * 1024 })

    const res = await gate.get('https://example.com/riesig')
    expect(res?.body).toBeNull()
    expect(res?.note).toBe('too_large')
    expect(gate.stats.size_blocked).toBe(1)
  })

  it('unterbricht hängende Antworten über den Timeout', async () => {
    const { impl } = fakeFetch(() => 'hang')
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0, timeoutMs: 120 })

    const res = await gate.get('https://example.com/hängt')
    expect(res?.note).toBe('error')
    expect(gate.stats.errors).toBe(1)
  }, 5000)

  it('fehlerhafte/fehlende robots.txt bedeutet: erlaubt', async () => {
    const { impl } = fakeFetch((url) => (url.endsWith('/robots.txt') ? { status: 404, body: '' } : OK))
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0 })
    expect(await gate.get('https://example.com/x')).not.toBeNull()
  })

  it('Robustheit: defekte URLs werfen eine klare Fehlermeldung, kein stiller Müll', async () => {
    const { impl } = fakeFetch(() => OK)
    const gate = new Politeness({ fetchImpl: impl, minDelayMs: 0 })
    await expect(gate.get('nicht-eine-url')).rejects.toThrow()
    await expect(gate.get('https://exa mple.com/x')).rejects.toThrow()
  })
})
