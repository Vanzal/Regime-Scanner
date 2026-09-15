'use client'

import { useActionState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { joinWaitlist, type WaitlistState } from '@/app/actions/waitlist'
import { LEGAL_DOCUMENTS } from '@/lib/legal/catalog'
import type { Dictionary } from '@/i18n'

const SubscribeCta = dynamic(() => import('./subscribe-cta').then((m) => m.SubscribeCta))

const SIZE_KEYS = ['lt_50', '50_249', '250_plus', 'unknown'] as const
const COUNTRY_KEYS = ['de', 'at', 'ch', 'other'] as const

const labelCls = 'block text-sm font-semibold text-[var(--ns-fg)]'

export function WaitlistForm({
  waitlist,
  subscribe,
}: {
  waitlist: Dictionary['site']['waitlist']
  subscribe: Dictionary['site']['subscribe']
}) {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, { ok: false })
  const w = waitlist
  const errors = state.errors ?? {}
  const errFor = (key: string): string | undefined => {
    if (!errors[key]) return undefined
    if (key === 'email') return w.errors.email
    if (key === 'country') return w.errors.country
    return w.errors.required
  }

  if (state.done) {
    return (
      <div
        role="status"
        data-testid="waitlist-success"
        className="ns-card px-6 py-10"
      >
        <p className="font-display text-xl tracking-tight text-[var(--ns-fg)]">{w.success}</p>
        {state.duplicate && (
          <p className="font-reading mt-2 text-sm text-[var(--ns-fg-muted)]">{w.duplicate}</p>
        )}
        <SubscribeCta copy={subscribe} defaultEmail={state.email ?? ''} />
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className={labelCls} htmlFor="wl_email">{w.email_label}</label>
        <input
          id="wl_email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="ns-input"
          aria-invalid={Boolean(errFor('email'))}
        />
        {errFor('email') && (
          <p className="mt-1 text-xs font-medium text-[var(--ns-danger)]">{errFor('email')}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="wl_size">{w.size_label}</label>
          <select id="wl_size" name="company_size" required defaultValue="" className="ns-input">
            <option value="" disabled>–</option>
            {SIZE_KEYS.map((s) => (
              <option key={s} value={s}>{w.size[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="wl_country">{w.country_label}</label>
          <select id="wl_country" name="country" required defaultValue="" className="ns-input">
            <option value="" disabled>–</option>
            {COUNTRY_KEYS.map((c) => (
              <option key={c} value={c}>{w.country[c]}</option>
            ))}
          </select>
          {errFor('country') && (
            <p className="mt-1 text-xs font-medium text-[var(--ns-danger)]">{errFor('country')}</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="wl_pain">{w.pain_label}</label>
        <textarea
          id="wl_pain"
          name="pain_note"
          rows={3}
          maxLength={500}
          placeholder={w.pain_placeholder}
          className="ns-input min-h-[5.5rem]"
        />
      </div>

      <button type="submit" disabled={pending} className="ns-btn-primary w-full sm:w-auto">
        {pending ? w.submitting : w.submit}
      </button>

      <p className="font-reading text-xs leading-relaxed text-[var(--ns-fg-dim)]">
        {w.privacy_note}{' '}
        <Link
          href={LEGAL_DOCUMENTS.privacy.href}
          className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]"
        >
          {w.privacy_link}
        </Link>
        .
      </p>
    </form>
  )
}
