'use client'

import { useActionState } from 'react'
import { joinWaitlist, type WaitlistState } from '@/app/actions/waitlist'
import { SubscribeCta } from '@/components/site/subscribe-cta'
import type { Dictionary } from '@/i18n'

const SIZE_KEYS = ['lt_50', '50_249', '250_plus', 'unknown'] as const
const COUNTRY_KEYS = ['de', 'at', 'ch', 'other'] as const

const labelCls = 'block text-sm font-semibold text-[var(--ns-fg)]'

export function WaitlistForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, { ok: false })
  const w = dict.site.waitlist
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
        className="border border-[var(--ns-border-strong)] bg-[var(--ns-bg)] px-6 py-10"
      >
        <p className="font-display text-xl tracking-tight text-[var(--ns-fg)]">{w.success}</p>
        {state.duplicate && (
          <p className="font-reading mt-2 text-sm text-[var(--ns-fg-muted)]">{w.duplicate}</p>
        )}
        <SubscribeCta dict={dict} defaultEmail={state.email ?? ''} />
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

      <p className="font-reading text-xs leading-relaxed text-[var(--ns-fg-dim)]">{w.privacy_note}</p>
    </form>
  )
}
