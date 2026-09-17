/**
 * Public site origin for metadata, Stripe return URLs, and report links.
 * Never returns an empty string — Vercel often sets SITE_URL="" which would
 * throw in `new URL('')` during `next build` (e.g. /_not-found).
 *
 * SEO surfaces (canonical, Open Graph, robots, sitemap) always use
 * {@link CANONICAL_ORIGIN} — never a Vercel preview / deployment URL.
 * Runtime callbacks (Stripe, scan runner) may still use SITE_URL or a
 * preview host so local and preview deploys keep working.
 */

export const CANONICAL_HOST = 'nexusscopes.com'
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`
const LOCAL_ORIGIN = 'http://localhost:3000'

function originFrom(raw: string | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(href)
    if (!url.hostname) return null
    return url.origin
  } catch {
    return null
  }
}

function hostnameOf(originOrHost: string): string {
  try {
    const href = /^https?:\/\//i.test(originOrHost) ? originOrHost : `https://${originOrHost}`
    return new URL(href).hostname.toLowerCase()
  } catch {
    return originOrHost.toLowerCase()
  }
}

function isVercelDeploymentHost(originOrHost: string): boolean {
  const host = hostnameOf(originOrHost)
  return host.endsWith('.vercel.app') || host.endsWith('.vercel.sh')
}

/** Prefer the non-www production origin when SITE_URL points at www. */
function normalizeOrigin(origin: string): string {
  const host = hostnameOf(origin)
  if (host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`) {
    return CANONICAL_ORIGIN
  }
  return origin
}

/** Absolute production origin, no trailing slash. Safe for `new URL(...)`. */
export function canonicalSiteUrl(): string {
  return CANONICAL_ORIGIN
}

/** Absolute production URL for a site path (`/` → origin). */
export function canonicalUrl(path: string = '/'): string {
  if (!path || path === '/') return CANONICAL_ORIGIN
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${CANONICAL_ORIGIN}${normalized}`
}

/**
 * 301 target when the request host is www.nexusscopes.com.
 * Returns null for any other host (apex, preview, localhost).
 */
export function wwwToApexRedirectUrl(host: string, pathname: string, search = ''): string | null {
  const hostname = host.split(':')[0]?.toLowerCase()
  if (hostname !== `www.${CANONICAL_HOST}`) return null
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${CANONICAL_ORIGIN}${path}${search}`
}

/** Absolute origin, no trailing slash. Safe for `new URL(siteUrl())`. */
export function siteUrl(): string {
  const configured = originFrom(process.env.SITE_URL)
  if (configured && !isVercelDeploymentHost(configured)) {
    return normalizeOrigin(configured)
  }

  if (process.env.VERCEL_ENV === 'production') {
    return CANONICAL_ORIGIN
  }

  const vercelHost = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//i, '')
  const fromVercel = originFrom(vercelHost ? `https://${vercelHost}` : undefined)

  if (fromVercel && process.env.VERCEL_ENV === 'preview') {
    return fromVercel
  }

  if (process.env.NODE_ENV === 'production') {
    return CANONICAL_ORIGIN
  }

  return fromVercel ?? LOCAL_ORIGIN
}

/** Always the production domain — used as Next.js `metadataBase`. */
export function siteMetadataBase(): URL {
  return new URL(`${CANONICAL_ORIGIN}/`)
}
