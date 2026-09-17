import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-url'

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
  '/terms',
  '/legal/privacy',
  '/legal/terms',
  '/legal/dpa',
  '/datenschutz',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const now = new Date()
  return PUBLIC_PATHS.map((path) => ({
    url: path === '/' ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/pricing' || path === '/intake' ? 0.8 : 0.5,
  }))
}
