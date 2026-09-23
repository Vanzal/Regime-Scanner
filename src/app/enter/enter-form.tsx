'use client'

import { useActionState } from 'react'
import { siteGateLogin } from '@/app/actions/site-gate'
import { LangSwitch } from '@/components/site/lang-switch'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import type { Locale } from '@/i18n'

export function EnterForm({
  next,
  locale,
  langLabel,
  themeLabel,
  title,
  body,
  placeholder,
  submit,
  error,
}: {
  next: string
  locale: Locale
  langLabel: string
  themeLabel: string
  title: string
  body: string
  placeholder: string
  submit: string
  error: string
}) {
  const [state, action, pending] = useActionState(siteGateLogin, undefined)
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end gap-2 px-4 py-4 sm:px-6">
        <LangSwitch locale={locale} label={langLabel} />
        <ThemeToggle label={themeLabel} />
      </div>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pb-24">
        <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
          NexusScope
        </p>
        <h1 className="mt-3 font-display text-2xl tracking-tight text-[var(--ns-fg)]">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{body}</p>
        <form action={action} className="mt-8 space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="sr-only" htmlFor="site-password">
            {placeholder}
          </label>
          <input
            id="site-password"
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder={placeholder}
            className={`ns-input mt-0 ${state?.error ? 'ns-input-error' : ''}`}
          />
          {state?.error && (
            <p role="alert" className="text-xs font-medium text-[var(--ns-danger)]">
              {error}
            </p>
          )}
          <button type="submit" disabled={pending} className="ns-btn-primary w-full">
            {submit}
          </button>
        </form>
      </main>
    </div>
  )
}
