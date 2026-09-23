/**
 * Site-wide preview password. Active when SITE_PASSWORD is set.
 * HMAC cookie is Edge-safe (Web Crypto) so middleware can verify it.
 */

export const SITE_GATE_COOKIE = 'ns_site'
export const SITE_GATE_PATH = '/enter'
export const SITE_GATE_MAX_AGE_S = 60 * 60 * 24 * 7

const encoder = new TextEncoder()

function secret(): string {
  const configured = process.env.SITE_SESSION_SECRET ?? process.env.SITE_PASSWORD
  if (configured) return configured
  return 'dev-insecure-site-gate'
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a[i]! ^ b[i]!
  return mismatch === 0
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    const n = Number.parseInt(hex.slice(i, i + 2), 16)
    if (Number.isNaN(n)) return null
    out[i / 2] = n
  }
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

async function hmacHex(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return bytesToHex(new Uint8Array(sig))
}

export function isSiteGateEnabled(): boolean {
  return Boolean(process.env.SITE_PASSWORD)
}

export function isSiteGatePublicPath(pathname: string): boolean {
  return (
    pathname === SITE_GATE_PATH ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/api/stripe/webhook' ||
    pathname === '/api/stripe/setup'
  )
}

/** Relative path only; blocks open redirects (`//`, `/\`, off-site). */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/'
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) return '/'
  try {
    const url = new URL(trimmed, 'https://nexusscopes.com')
    if (url.origin !== 'https://nexusscopes.com') return '/'
    if (url.pathname === SITE_GATE_PATH || url.pathname.startsWith(`${SITE_GATE_PATH}/`)) return '/'
    return `${url.pathname}${url.search}`
  } catch {
    return '/'
  }
}

export async function signSiteGateCookie(): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + SITE_GATE_MAX_AGE_S)
  const payload = `site.${exp}`
  const sig = await hmacHex(payload)
  return `${exp}.${sig}`
}

export async function verifySiteGateCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false
  const dot = value.indexOf('.')
  if (dot <= 0) return false
  const exp = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  if (!exp || !sig) return false
  const expect = await hmacHex(`site.${exp}`)
  const a = hexToBytes(sig)
  const b = hexToBytes(expect)
  if (!a || !b || !timingSafeEqualBytes(a, b)) return false
  return Number(exp) > Math.floor(Date.now() / 1000)
}

export function checkSitePassword(input: string): boolean {
  const expected = process.env.SITE_PASSWORD
  if (!expected) return false
  return timingSafeEqualBytes(encoder.encode(input), encoder.encode(expected))
}

export type SiteGateDecision =
  | { type: 'next' }
  | { type: 'redirect'; location: string }

export async function decideSiteGate(input: {
  pathname: string
  search?: string
  cookie?: string
}): Promise<SiteGateDecision> {
  const search = input.search ?? ''

  if (!isSiteGateEnabled()) {
    if (input.pathname === SITE_GATE_PATH) return { type: 'redirect', location: '/' }
    return { type: 'next' }
  }

  const authed = await verifySiteGateCookie(input.cookie)
  if (authed) {
    if (input.pathname === SITE_GATE_PATH) {
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      return { type: 'redirect', location: safeNextPath(params.get('next')) }
    }
    return { type: 'next' }
  }

  if (isSiteGatePublicPath(input.pathname)) return { type: 'next' }

  const intended = safeNextPath(`${input.pathname}${search}`)
  if (intended === '/') return { type: 'redirect', location: SITE_GATE_PATH }
  const dest = new URLSearchParams()
  dest.set('next', intended)
  return { type: 'redirect', location: `${SITE_GATE_PATH}?${dest.toString()}` }
}
