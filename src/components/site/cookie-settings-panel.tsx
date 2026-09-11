'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Dictionary } from '@/i18n'
import {
  type CookieConsent,
  type OptionalCookieCategory,
  consentAll,
  consentNecessaryOnly,
  readCookieConsent,
  writeCookieConsent,
} from '@/lib/cookies/consent'

const OPTIONAL: OptionalCookieCategory[] = ['preferences', 'analytics', 'marketing']

/**
 * Full cookie preference UI (Privacy Policy §8): accept all, reject all,
 * or choose per category. Reject is styled as prominently as accept.
 */
export function CookieSettingsPanel({
  dict,
  showPolicyLink = true,
}: {
  dict: Dictionary
  showPolicyLink?: boolean
}) {
  const c = dict.site.cookie
  const [draft, setDraft] = useState<CookieConsent>(() => consentNecessaryOnly())
  const [saved, setSaved] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const existing = readCookieConsent()
    setDraft(existing ?? consentNecessaryOnly())
    setReady(true)
  }, [])

  const toggle = (key: OptionalCookieCategory) => {
    setSaved(false)
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const persist = (next: CookieConsent) => {
    writeCookieConsent(next)
    setDraft(next)
    setSaved(true)
  }

  if (!ready) {
    return (
      <div
        data-testid="cookie-settings-panel"
        className="min-h-48 animate-pulse rounded-[var(--ns-radius)] border border-[var(--ns-border)] bg-[var(--ns-bg-elevated)]"
        aria-hidden
      />
    )
  }

  return (
    <div data-testid="cookie-settings-panel" className="space-y-8">
      <p className="font-reading text-sm leading-relaxed text-[var(--ns-fg-muted)]">{c.settings_intro}</p>

      <ul className="space-y-4">
        <li className="border border-[var(--ns-border)] bg-[var(--ns-bg-elevated)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ns-fg)]">{c.categories.necessary.label}</p>
              <p className="font-reading mt-1 text-sm leading-relaxed text-[var(--ns-fg-muted)]">
                {c.categories.necessary.description}
              </p>
            </div>
            <span className="shrink-0 font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
              {c.always_on}
            </span>
          </div>
        </li>

        {OPTIONAL.map((key) => (
          <li key={key} className="border border-[var(--ns-border)] bg-[var(--ns-bg-elevated)] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--ns-fg)]">{c.categories[key].label}</p>
                <p className="font-reading mt-1 text-sm leading-relaxed text-[var(--ns-fg-muted)]">
                  {c.categories[key].description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft[key]}
                aria-label={c.categories[key].label}
                data-testid={`cookie-toggle-${key}`}
                onClick={() => toggle(key)}
                className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-[var(--ns-radius)] border transition ${
                  draft[key]
                    ? 'border-[var(--ns-fg)] bg-[var(--ns-fg)]'
                    : 'border-[var(--ns-border-strong)] bg-[var(--ns-bg)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-[1px] transition ${
                    draft[key]
                      ? 'left-6 bg-[var(--ns-accent-fg)]'
                      : 'left-0.5 bg-[var(--ns-fg)]'
                  }`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          data-testid="cookie-reject-all"
          onClick={() => persist(consentNecessaryOnly())}
          className="inline-flex min-h-11 items-center justify-center border-2 border-[var(--ns-fg)] bg-[var(--ns-bg)] px-5 text-sm font-bold text-[var(--ns-fg)] transition hover:bg-[var(--ns-bg-elevated)]"
        >
          {c.reject_all}
        </button>
        <button
          type="button"
          data-testid="cookie-accept-all"
          onClick={() => persist(consentAll())}
          className="ns-btn-primary !min-h-11 px-5 text-sm"
        >
          {c.accept_all}
        </button>
        <button
          type="button"
          data-testid="cookie-save"
          onClick={() => persist(draft)}
          className="inline-flex min-h-11 items-center justify-center border border-[var(--ns-border-strong)] bg-[var(--ns-bg-elevated)] px-5 text-sm font-semibold text-[var(--ns-fg)] transition hover:border-[var(--ns-fg)]"
        >
          {c.save}
        </button>
      </div>

      {saved ? (
        <p data-testid="cookie-settings-saved" className="font-reading text-sm text-[var(--ns-success)]">
          {c.saved}
        </p>
      ) : null}

      {showPolicyLink ? (
        <p className="font-reading text-xs text-[var(--ns-fg-dim)]">
          <Link
            href="/cookies"
            className="underline decoration-[var(--ns-border)] underline-offset-4 hover:text-[var(--ns-fg-muted)]"
          >
            {c.policy_link}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
