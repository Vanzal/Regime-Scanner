import { afterEach, describe, expect, it } from 'vitest'
import {
  CANONICAL_ORIGIN,
  canonicalSiteUrl,
  canonicalUrl,
  siteMetadataBase,
  siteUrl,
  wwwToApexRedirectUrl,
} from '@/lib/site-url'

const KEYS = ['SITE_URL', 'VERCEL_URL', 'VERCEL_ENV', 'NODE_ENV'] as const

function setEnv(key: (typeof KEYS)[number], value: string | undefined) {
  const env = process.env as Record<string, string | undefined>
  if (value === undefined) delete env[key]
  else env[key] = value
}

describe('siteUrl', () => {
  const previous: Record<string, string | undefined> = {}

  afterEach(() => {
    for (const key of KEYS) setEnv(key, previous[key])
  })

  function snapshotEnv() {
    for (const key of KEYS) previous[key] = process.env[key]
  }

  it('falls back when SITE_URL is empty (Vercel-style) and never yields new URL(""))', () => {
    snapshotEnv()
    process.env.SITE_URL = ''
    delete process.env.VERCEL_URL
    delete process.env.VERCEL_ENV
    setEnv('NODE_ENV', 'production')
    const origin = siteUrl()
    expect(origin).toBe('https://nexusscopes.com')
    expect(() => new URL(origin)).not.toThrow()
    expect(siteMetadataBase().href).toBe('https://nexusscopes.com/')
  })

  it('treats whitespace-only SITE_URL as missing', () => {
    snapshotEnv()
    process.env.SITE_URL = '   '
    delete process.env.VERCEL_URL
    delete process.env.VERCEL_ENV
    setEnv('NODE_ENV', 'production')
    expect(siteUrl()).toBe('https://nexusscopes.com')
  })

  it('uses a configured SITE_URL origin', () => {
    snapshotEnv()
    process.env.SITE_URL = 'https://preview.example.com/'
    expect(siteUrl()).toBe('https://preview.example.com')
  })

  it('normalizes www production SITE_URL to the apex origin', () => {
    snapshotEnv()
    process.env.SITE_URL = 'https://www.nexusscopes.com/'
    expect(siteUrl()).toBe('https://nexusscopes.com')
  })

  it('ignores Vercel deployment SITE_URL values', () => {
    snapshotEnv()
    process.env.SITE_URL = 'https://regime-scanner-abc.vercel.app'
    process.env.VERCEL_ENV = 'production'
    expect(siteUrl()).toBe('https://nexusscopes.com')
  })

  it('uses VERCEL_URL on preview deployments for runtime callbacks', () => {
    snapshotEnv()
    process.env.SITE_URL = ''
    process.env.VERCEL_URL = 'regime-scanner-abc.vercel.app'
    process.env.VERCEL_ENV = 'preview'
    setEnv('NODE_ENV', 'production')
    expect(siteUrl()).toBe('https://regime-scanner-abc.vercel.app')
  })

  it('uses the canonical origin in Vercel production when SITE_URL is empty', () => {
    snapshotEnv()
    process.env.SITE_URL = ''
    process.env.VERCEL_URL = 'regime-scanner-abc.vercel.app'
    process.env.VERCEL_ENV = 'production'
    setEnv('NODE_ENV', 'production')
    expect(siteUrl()).toBe('https://nexusscopes.com')
  })

  it('ignores an invalid SITE_URL instead of throwing', () => {
    snapshotEnv()
    process.env.SITE_URL = '::::'
    delete process.env.VERCEL_URL
    delete process.env.VERCEL_ENV
    setEnv('NODE_ENV', 'production')
    expect(siteUrl()).toBe('https://nexusscopes.com')
    expect(() => siteMetadataBase()).not.toThrow()
  })
})

describe('canonical SEO origin', () => {
  const previous: Record<string, string | undefined> = {}

  afterEach(() => {
    for (const key of KEYS) setEnv(key, previous[key])
  })

  function snapshotEnv() {
    for (const key of KEYS) previous[key] = process.env[key]
  }

  it('never uses Vercel deployment URLs for metadataBase or canonical URLs', () => {
    snapshotEnv()
    process.env.SITE_URL = ''
    process.env.VERCEL_URL = 'regime-scanner-abc.vercel.app'
    process.env.VERCEL_ENV = 'preview'
    expect(canonicalSiteUrl()).toBe(CANONICAL_ORIGIN)
    expect(siteMetadataBase().href).toBe('https://nexusscopes.com/')
    expect(canonicalUrl('/pricing')).toBe('https://nexusscopes.com/pricing')
    expect(canonicalUrl('/')).toBe('https://nexusscopes.com')
  })

  it('redirects www.nexusscopes.com to the apex origin', () => {
    expect(wwwToApexRedirectUrl('www.nexusscopes.com', '/pricing', '?ref=1')).toBe(
      'https://nexusscopes.com/pricing?ref=1',
    )
    expect(wwwToApexRedirectUrl('www.nexusscopes.com:443', '/', '')).toBe('https://nexusscopes.com/')
    expect(wwwToApexRedirectUrl('nexusscopes.com', '/pricing', '')).toBeNull()
    expect(wwwToApexRedirectUrl('localhost:3000', '/', '')).toBeNull()
  })
})
