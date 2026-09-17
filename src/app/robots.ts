import type { MetadataRoute } from 'next'
import { canonicalSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = canonicalSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/scan/', '/report/', '/incident/', '/billing/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
