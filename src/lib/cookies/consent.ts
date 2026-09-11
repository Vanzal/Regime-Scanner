/** Client-side cookie consent model aligned with Privacy Policy §8. */

export const COOKIE_CONSENT_KEY = 'ns-cookie-consent'
export const COOKIE_CONSENT_VERSION = 1 as const
export const COOKIE_CONSENT_EVENT = 'ns:cookie-consent-changed'

export const COOKIE_CATEGORIES = ['necessary', 'preferences', 'analytics', 'marketing'] as const
export type CookieCategory = (typeof COOKIE_CATEGORIES)[number]
export type OptionalCookieCategory = Exclude<CookieCategory, 'necessary'>

export type CookieConsent = {
  version: typeof COOKIE_CONSENT_VERSION
  necessary: true
  preferences: boolean
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

export function consentAll(): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
    updatedAt: new Date().toISOString(),
  }
}

export function consentNecessaryOnly(): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  }
}

export function isCookieConsent(value: unknown): value is CookieConsent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    v.version === COOKIE_CONSENT_VERSION &&
    v.necessary === true &&
    typeof v.preferences === 'boolean' &&
    typeof v.analytics === 'boolean' &&
    typeof v.marketing === 'boolean' &&
    typeof v.updatedAt === 'string'
  )
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isCookieConsent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeCookieConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return
  const next: CookieConsent = {
    ...consent,
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next))
  } catch {
    // storage blocked — still notify listeners for in-session UX
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: next }))
}

export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: null }))
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null
}
