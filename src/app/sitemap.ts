import type { MetadataRoute } from 'next'
import { isSiteGateEnabled } from '@/lib/site-gate'
import { canonicalSiteUrl } from '@/lib/site-url'

/** Canonical public URLs only (aliases 301 to these paths). */
const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/contact',
  '/intake',
  '/impressum',
  '/cookies',
  '/cookie-settings',
  '/privacy',
  '/dpa',
  '/legal/terms',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  if (isSiteGateEnabled()) return []
  const base = canonicalSiteUrl()
  const now = new Date()
  return PUBLIC_PATHS.map((path) => ({
    url: path === '/' ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/pricing' || path === '/intake' ? 0.8 : 0.5,
  }))
}
