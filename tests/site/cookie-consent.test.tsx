import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDict } from '@/i18n'

function installStorage() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
  }
  vi.stubGlobal('localStorage', localStorage)
  vi.stubGlobal('window', {
    localStorage,
    dispatchEvent: vi.fn(() => true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    CustomEvent: class CustomEvent {
      type: string
      detail: unknown
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type
        this.detail = init?.detail
      }
    },
  })
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

describe('cookie consent storage', () => {
  beforeEach(() => {
    installStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('builds accept-all and necessary-only presets', async () => {
    const { consentAll, consentNecessaryOnly } = await import('@/lib/cookies/consent')
    expect(consentAll()).toMatchObject({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    })
    expect(consentNecessaryOnly()).toMatchObject({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    })
  })

  it('validates consent shape', async () => {
    const { consentAll, isCookieConsent } = await import('@/lib/cookies/consent')
    expect(isCookieConsent(consentAll())).toBe(true)
    expect(isCookieConsent({ version: 1, necessary: true })).toBe(false)
    expect(isCookieConsent(null)).toBe(false)
  })

  it('persists and reads consent from localStorage', async () => {
    const {
      COOKIE_CONSENT_KEY,
      clearCookieConsent,
      consentAll,
      hasCookieConsentChoice,
      readCookieConsent,
      writeCookieConsent,
    } = await import('@/lib/cookies/consent')

    expect(hasCookieConsentChoice()).toBe(false)
    writeCookieConsent(consentAll())
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBeTruthy()
    expect(readCookieConsent()?.analytics).toBe(true)
    expect(hasCookieConsentChoice()).toBe(true)

    clearCookieConsent()
    expect(readCookieConsent()).toBeNull()
    expect(hasCookieConsentChoice()).toBe(false)
  })
})

describe('cookie UI wiring', () => {
  beforeEach(() => {
    installStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Cookie Settings link points to /cookie-settings', async () => {
    const { CookieSettingsLink } = await import('@/components/site/cookie-settings-link')
    const html = renderToStaticMarkup(
      <CookieSettingsLink label="Cookie Settings" className="x" />,
    )
    expect(html).toContain('href="/cookie-settings"')
    expect(html).toContain('Cookie Settings')
  })

  it('footer exposes /cookies and /cookie-settings', async () => {
    const { SiteFooter } = await import('@/components/site/site-footer')
    const dict = getDict('en')
    const html = renderToStaticMarkup(<SiteFooter dict={dict} locale="en" />)
    expect(html).toContain('href="/cookie-settings"')
    expect(html).toContain('href="/cookies"')
    expect(html).toContain('Cookie Settings')
  })

  it('settings panel SSR shell mounts', async () => {
    const { CookieSettingsPanel } = await import('@/components/site/cookie-settings-panel')
    const dict = getDict('en')
    const html = renderToStaticMarkup(<CookieSettingsPanel dict={dict} />)
    expect(html).toContain('data-testid="cookie-settings-panel"')
  })
})
