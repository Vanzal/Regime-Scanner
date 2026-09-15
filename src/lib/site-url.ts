/**
 * Public site origin for metadata, Stripe return URLs, and report links.
 * Never returns an empty string — Vercel often sets SITE_URL="" which would
 * throw in `new URL('')` during `next build` (e.g. /_not-found).
 */

const CANONICAL_ORIGIN = 'https://nexusscopes.com'
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

/** Absolute origin, no trailing slash. Safe for `new URL(siteUrl())`. */
export function siteUrl(): string {
  const vercelHost = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//i, '')
  return (
    originFrom(process.env.SITE_URL) ??
    originFrom(vercelHost ? `https://${vercelHost}` : undefined) ??
    (process.env.NODE_ENV === 'production' ? CANONICAL_ORIGIN : LOCAL_ORIGIN)
  )
}

export function siteMetadataBase(): URL {
  return new URL(siteUrl())
}
