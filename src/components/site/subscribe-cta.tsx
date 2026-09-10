'use client'

import { useActionState } from 'react'
import {
  startSubscriptionCheckout,
  type SubscribeState,
} from '@/app/actions/stripe'
import type { Dictionary } from '@/i18n'

export function SubscribeCta({
  dict,
  defaultEmail = '',
}: {
  dict: Dictionary
  defaultEmail?: string
}) {
  const [state, formAction, pending] = useActionState<SubscribeState, FormData>(
    startSubscriptionCheckout,
    { ok: false },
  )
  const s = dict.site.subscribe
  const err = state.errors?.email
    ? s.errors.email
    : state.errors?.form
      ? s.errors[state.errors.form as keyof typeof s.errors] ?? s.errors.checkout_failed
      : undefined

  return (
    <form action={formAction} className="mt-6 border-t border-[var(--ns-border)] pt-6" data-testid="subscribe-cta">
      <p className="font-display text-base tracking-tight text-[var(--ns-fg)]">{s.title}</p>
      <p className="font-reading mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{s.subtitle}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-[var(--ns-fg)]" htmlFor="sub_email">
            {s.email_label}
          </label>
          <input
            id="sub_email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            autoComplete="email"
            className="ns-input"
          />
        </div>
        <button type="submit" disabled={pending} className="ns-btn-primary shrink-0">
          {pending ? s.submitting : s.submit}
        </button>
      </div>
      {err && (
        <p className="mt-2 text-xs font-medium text-[var(--ns-danger)]" role="alert">
          {err}
        </p>
      )}
      <p className="font-reading mt-3 text-xs leading-relaxed text-[var(--ns-fg-dim)]">{s.note}</p>
    </form>
  )
}
