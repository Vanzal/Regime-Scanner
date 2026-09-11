'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Dictionary } from '@/i18n'
import {
  COOKIE_CONSENT_EVENT,
  consentAll,
  consentNecessaryOnly,
  hasCookieConsentChoice,
  writeCookieConsent,
} from '@/lib/cookies/consent'

/**
 * First-visit consent banner (Privacy Policy §8): accept all, reject all,
 * or open Cookie Settings. Reject is as prominent as accept.
 */
export function CookieBanner({ dict }: { dict: Dictionary }) {
  const [visible, setVisible] = useState(false)
  const c = dict.site.cookie

  useEffect(() => {
    const sync = () => setVisible(!hasCookieConsentChoice())
    sync()
    window.addEventListener(COOKIE_CONSENT_EVENT, sync)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync)
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    writeCookieConsent(consentAll())
    setVisible(false)
  }

  const rejectAll = () => {
    writeCookieConsent(consentNecessaryOnly())
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label={c.banner_label}
      data-testid="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[var(--ns-fg)] bg-[var(--ns-bg-elevated)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
        <p className="font-reading text-xs leading-relaxed text-[var(--ns-fg-muted)] sm:text-sm">{c.text}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            data-testid="cookie-banner-reject"
            onClick={rejectAll}
            className="inline-flex min-h-10 items-center justify-center border-2 border-[var(--ns-fg)] bg-[var(--ns-bg)] px-4 text-xs font-bold text-[var(--ns-fg)] transition hover:bg-[var(--ns-bg-elevated)]"
          >
            {c.reject_all}
          </button>
          <button
            type="button"
            data-testid="cookie-banner-accept"
            onClick={acceptAll}
            className="ns-btn-primary !min-h-10 px-4 text-xs"
          >
            {c.accept_all}
          </button>
          <Link
            href="/cookie-settings"
            data-testid="cookie-banner-customize"
            className="inline-flex min-h-10 items-center justify-center px-2 text-xs font-semibold text-[var(--ns-fg-muted)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg)]"
          >
            {c.customize}
          </Link>
        </div>
      </div>
    </div>
  )
}
