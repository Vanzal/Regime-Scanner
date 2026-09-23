import { afterEach, describe, expect, it } from 'vitest'
import {
  checkSitePassword,
  decideSiteGate,
  isSiteGateEnabled,
  isSiteGatePublicPath,
  safeNextPath,
  signSiteGateCookie,
  verifySiteGateCookie,
} from '@/lib/site-gate'

const KEYS = ['SITE_PASSWORD', 'SITE_SESSION_SECRET'] as const

function setEnv(key: (typeof KEYS)[number], value: string | undefined) {
  const env = process.env as Record<string, string | undefined>
  if (value === undefined) delete env[key]
  else env[key] = value
}

describe('site gate', () => {
  const previous: Record<string, string | undefined> = {}

  afterEach(() => {
    for (const key of KEYS) setEnv(key, previous[key])
  })

  function snapshotEnv() {
    for (const key of KEYS) previous[key] = process.env[key]
  }

  it('is off unless SITE_PASSWORD is set', () => {
    snapshotEnv()
    delete process.env.SITE_PASSWORD
    expect(isSiteGateEnabled()).toBe(false)
    process.env.SITE_PASSWORD = 'preview-secret'
    expect(isSiteGateEnabled()).toBe(true)
  })

  it('compares the site password in constant time', () => {
    snapshotEnv()
    process.env.SITE_PASSWORD = 'preview-secret'
    expect(checkSitePassword('preview-secret')).toBe(true)
    expect(checkSitePassword('wrong')).toBe(false)
    expect(checkSitePassword('')).toBe(false)
  })

  it('rejects password checks when the gate is unset', () => {
    snapshotEnv()
    delete process.env.SITE_PASSWORD
    expect(checkSitePassword('anything')).toBe(false)
  })

  it('signs and verifies a gate cookie, and rejects tampering and expiry', async () => {
    snapshotEnv()
    process.env.SITE_PASSWORD = 'preview-secret'
    process.env.SITE_SESSION_SECRET = 'session-secret'
    const value = await signSiteGateCookie()
    expect(await verifySiteGateCookie(value)).toBe(true)
    expect(await verifySiteGateCookie(undefined)).toBe(false)
    expect(await verifySiteGateCookie('not-a-token')).toBe(false)
    const [exp, sig] = value.split('.')
    expect(await verifySiteGateCookie(`${exp}.${sig.slice(0, -2)}aa`)).toBe(false)
    expect(await verifySiteGateCookie(`1.${sig}`)).toBe(false)
  })

  it('keeps robots, sitemap, enter, and Stripe endpoints public', () => {
    expect(isSiteGatePublicPath('/enter')).toBe(true)
    expect(isSiteGatePublicPath('/robots.txt')).toBe(true)
    expect(isSiteGatePublicPath('/sitemap.xml')).toBe(true)
    expect(isSiteGatePublicPath('/api/stripe/webhook')).toBe(true)
    expect(isSiteGatePublicPath('/api/stripe/setup')).toBe(true)
    expect(isSiteGatePublicPath('/')).toBe(false)
    expect(isSiteGatePublicPath('/pricing')).toBe(false)
    expect(isSiteGatePublicPath('/api/scan-status/abc')).toBe(false)
  })

  it('blocks open redirects in the next path', () => {
    expect(safeNextPath('/pricing')).toBe('/pricing')
    expect(safeNextPath('/report/abc?print=1')).toBe('/report/abc?print=1')
    expect(safeNextPath('https://evil.example/phish')).toBe('/')
    expect(safeNextPath('//evil.example')).toBe('/')
    expect(safeNextPath('/\\evil.example')).toBe('/')
    expect(safeNextPath('/enter')).toBe('/')
    expect(safeNextPath('/enter?next=/pricing')).toBe('/')
    expect(safeNextPath('')).toBe('/')
  })

  it('sends anonymous visitors to /enter when the gate is on', async () => {
    snapshotEnv()
    process.env.SITE_PASSWORD = 'preview-secret'
    expect(await decideSiteGate({ pathname: '/', cookie: undefined })).toEqual({
      type: 'redirect',
      location: '/enter',
    })
    expect(await decideSiteGate({ pathname: '/pricing', cookie: undefined })).toEqual({
      type: 'redirect',
      location: '/enter?next=%2Fpricing',
    })
    expect(await decideSiteGate({ pathname: '/enter', cookie: undefined })).toEqual({ type: 'next' })
    expect(await decideSiteGate({ pathname: '/api/stripe/webhook', cookie: undefined })).toEqual({
      type: 'next',
    })
  })

  it('lets a valid cookie through and bounces /enter to next', async () => {
    snapshotEnv()
    process.env.SITE_PASSWORD = 'preview-secret'
    const cookie = await signSiteGateCookie()
    expect(await decideSiteGate({ pathname: '/pricing', cookie })).toEqual({ type: 'next' })
    expect(await decideSiteGate({ pathname: '/enter', search: '?next=/contact', cookie })).toEqual({
      type: 'redirect',
      location: '/contact',
    })
  })

  it('hides /enter when the gate is off', async () => {
    snapshotEnv()
    delete process.env.SITE_PASSWORD
    expect(await decideSiteGate({ pathname: '/', cookie: undefined })).toEqual({ type: 'next' })
    expect(await decideSiteGate({ pathname: '/enter', cookie: undefined })).toEqual({
      type: 'redirect',
      location: '/',
    })
  })
})
