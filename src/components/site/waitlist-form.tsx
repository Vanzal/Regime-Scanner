'use client'

import { useActionState, useId } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { joinWaitlist, type WaitlistState } from '@/app/actions/waitlist'
import { LEGAL_DOCUMENTS } from '@/lib/legal/catalog'
import type { Dictionary } from '@/i18n'
import { cn } from '@/lib/utils'

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
  const formErrorId = useId()
  const emailErrId = useId()
  const countryErrId = useId()
  const sizeErrId = useId()
  const errFor = (key: string): string | undefined => {
    if (!errors[key]) return undefined
    if (key === 'email') return w.errors.email
    if (key === 'country') return w.errors.country
    if (key === 'company_size' || key === 'size') return w.errors.size
    if (key === 'form') return w.errors.form
    return w.errors.required
  }
  const formError = errFor('form')

  if (state.done) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="waitlist-success"
        className="rounded-[var(--ns-radius)] border border-[color-mix(in_oklch,var(--ns-success)_40%,transparent)] bg-[color-mix(in_oklch,var(--ns-success)_8%,transparent)] px-5 py-8 sm:px-6 sm:py-10"
      >
        <p className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-success)]">
          {w.success_eyebrow}
        </p>
        <p className="mt-2 font-display text-xl tracking-tight text-[var(--ns-fg)]">{w.success}</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{w.success_next}</p>
        {state.duplicate && (
          <p className="font-reading mt-2 text-sm text-[var(--ns-fg-muted)]">{w.duplicate}</p>
        )}
        <SubscribeCta copy={subscribe} defaultEmail={state.email ?? ''} />
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" noValidate={false} aria-busy={pending}>
      {formError ? (
        <p id={formErrorId} role="alert" className="rounded-[var(--ns-radius)] border border-[color-mix(in_oklch,var(--ns-danger)_45%,transparent)] bg-[color-mix(in_oklch,var(--ns-danger)_8%,transparent)] px-3 py-2.5 text-sm font-medium text-[var(--ns-danger)]">
          {formError}
        </p>
      ) : null}

      <div>
        <label className={labelCls} htmlFor="wl_email">{w.email_label}</label>
        <input
          id="wl_email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className={cn('ns-input', errFor('email') && 'ns-input-error')}
          aria-invalid={Boolean(errFor('email'))}
          aria-describedby={errFor('email') ? emailErrId : undefined}
          disabled={pending}
        />
        {errFor('email') && (
          <p id={emailErrId} role="alert" className="mt-1.5 text-xs font-medium text-[var(--ns-danger)]">
            {errFor('email')}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="wl_size">{w.size_label}</label>
          <select
            id="wl_size"
            name="company_size"
            required
            defaultValue=""
            className={cn('ns-input', errFor('company_size') && 'ns-input-error')}
            aria-invalid={Boolean(errFor('company_size'))}
            aria-describedby={errFor('company_size') ? sizeErrId : undefined}
            disabled={pending}
          >
            <option value="" disabled>
              –
            </option>
            {SIZE_KEYS.map((s) => (
              <option key={s} value={s}>
                {w.size[s]}
              </option>
            ))}
          </select>
          {errFor('company_size') && (
            <p id={sizeErrId} role="alert" className="mt-1.5 text-xs font-medium text-[var(--ns-danger)]">
              {errFor('company_size')}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="wl_country">{w.country_label}</label>
          <select
            id="wl_country"
            name="country"
            required
            defaultValue=""
            className={cn('ns-input', errFor('country') && 'ns-input-error')}
            aria-invalid={Boolean(errFor('country'))}
            aria-describedby={errFor('country') ? countryErrId : undefined}
            disabled={pending}
          >
            <option value="" disabled>
              –
            </option>
            {COUNTRY_KEYS.map((c) => (
              <option key={c} value={c}>
                {w.country[c]}
              </option>
            ))}
          </select>
          {errFor('country') && (
            <p id={countryErrId} role="alert" className="mt-1.5 text-xs font-medium text-[var(--ns-danger)]">
              {errFor('country')}
            </p>
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
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className={cn('ns-btn-primary w-full sm:w-auto', pending && 'ns-btn-loading')}
          aria-disabled={pending}
        >
          {pending ? (
            <>
              <span className="ns-spinner" aria-hidden />
              <span>{w.submitting}</span>
            </>
          ) : (
            w.submit
          )}
        </button>
      </div>

      <p className="font-reading text-xs leading-relaxed text-[var(--ns-fg-dim)]">
        {w.privacy_note}{' '}
        <Link
          href={LEGAL_DOCUMENTS.privacy.href}
          className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]"
        >
          {w.privacy_link}
        </Link>
        .
      </p>
    </form>
  )
}
