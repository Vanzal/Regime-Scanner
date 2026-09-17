import { describe, expect, it } from 'vitest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { jsonLdGraph, publicPageMeta, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/seo'

const PRODUCTION = 'https://nexusscopes.com'

describe('robots.txt', () => {
  it('pins host and sitemap to the production domain and keeps private disallows', () => {
    const previous = { SITE_URL: process.env.SITE_URL, VERCEL_URL: process.env.VERCEL_URL }
    process.env.VERCEL_URL = 'regime-scanner-abc.vercel.app'
    process.env.SITE_URL = ''
    try {
      const doc = robots()
      expect(doc.host).toBe(PRODUCTION)
      expect(doc.sitemap).toBe(`${PRODUCTION}/sitemap.xml`)
      const rules = Array.isArray(doc.rules) ? doc.rules[0] : doc.rules
      expect(rules?.allow).toBe('/')
      expect(rules?.disallow).toEqual(['/admin', '/api/', '/scan/', '/report/', '/incident/', '/billing/'])
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })
})

describe('sitemap', () => {
  it('emits production loc URLs for public pages', () => {
    const entries = sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls.every((url) => url.startsWith(PRODUCTION))).toBe(true)
    expect(urls.some((url) => url.includes('vercel.app'))).toBe(false)
    expect(urls).toEqual(
      expect.arrayContaining([
        PRODUCTION,
        `${PRODUCTION}/pricing`,
        `${PRODUCTION}/contact`,
        `${PRODUCTION}/intake`,
      ]),
    )
  })
})

describe('publicPageMeta', () => {
  it('sets canonical, og:url, twitter:url and hreflang on the production domain', () => {
    const meta = publicPageMeta('/pricing', { title: 'Pricing' })
    expect(meta.alternates?.canonical).toBe(`${PRODUCTION}/pricing`)
    expect(meta.alternates?.languages).toEqual({
      en: `${PRODUCTION}/pricing`,
      de: `${PRODUCTION}/pricing`,
      'x-default': `${PRODUCTION}/pricing`,
    })
    expect(meta.openGraph?.url).toBe(`${PRODUCTION}/pricing`)
    expect(meta.other?.['twitter:url']).toBe(`${PRODUCTION}/pricing`)
    expect(meta.title).toBe('Pricing')
  })

  it('keeps the homepage title and description copy', () => {
    expect(SITE_TITLE).toBe('NexusScope — DACH Regulatory Readiness Intelligence')
    expect(SITE_DESCRIPTION).toMatch(/DACH companies/)
  })
})

describe('JSON-LD', () => {
  it('describes Organization, WebSite and SoftwareApplication on the production domain', () => {
    const graph = jsonLdGraph()
    expect(graph['@context']).toBe('https://schema.org')
    const nodes = graph['@graph'] as Array<Record<string, unknown>>
    const types = nodes.map((n) => n['@type'])
    expect(types).toEqual(['Organization', 'WebSite', 'SoftwareApplication'])
    for (const node of nodes) {
      expect(node.url).toBe(PRODUCTION)
    }
    expect(nodes[0]?.name).toBe('NexusScope')
    const app = nodes.find((n) => n['@type'] === 'SoftwareApplication')
    expect(String(app?.description)).toMatch(/NIS2UmsuCG/)
    expect(String(app?.description)).toMatch(/NISG 2024/)
    expect(String(app?.description)).toMatch(/ISG/)
  })
})
