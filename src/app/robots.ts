import type { MetadataRoute } from 'next'
import { isSiteGateEnabled } from '@/lib/site-gate'
import { canonicalSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = canonicalSiteUrl()
  if (isSiteGateEnabled()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      host: base,
    }
  }
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
