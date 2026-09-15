import { afterEach, describe, expect, it } from 'vitest'
import { siteMetadataBase, siteUrl } from '@/lib/site-url'

const KEYS = ['SITE_URL', 'VERCEL_URL', 'NODE_ENV'] as const

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
    setEnv('NODE_ENV', 'production')
    expect(siteUrl()).toBe('https://nexusscopes.com')
  })

  it('uses a configured SITE_URL origin', () => {
    snapshotEnv()
    process.env.SITE_URL = 'https://preview.example.com/'
    expect(siteUrl()).toBe('https://preview.example.com')
  })

  it('uses VERCEL_URL when SITE_URL is empty', () => {
    snapshotEnv()
    process.env.SITE_URL = ''
    process.env.VERCEL_URL = 'regime-scanner-abc.vercel.app'
    expect(siteUrl()).toBe('https://regime-scanner-abc.vercel.app')
  })

  it('ignores an invalid SITE_URL instead of throwing', () => {
    snapshotEnv()
    process.env.SITE_URL = '::::'
    delete process.env.VERCEL_URL
    setEnv('NODE_ENV', 'production')
    expect(siteUrl()).toBe('https://nexusscopes.com')
    expect(() => siteMetadataBase()).not.toThrow()
  })
})
