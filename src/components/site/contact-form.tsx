'use client'

import { useActionState, useId } from 'react'
import Link from 'next/link'
import { sendContact, type ContactState } from '@/app/actions/contact'
import { LEGAL_DOCUMENTS } from '@/lib/legal/catalog'
import type { Dictionary } from '@/i18n'

const labelCls = 'block text-sm font-semibold text-[var(--ns-fg)]'

export function ContactForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContact, { ok: false })
  const c = dict.site.contact_page
  const errors = state.errors ?? {}
  const nameErrId = useId()
  const emailErrId = useId()
  const messageErrId = useId()

  if (state.done) {
    return (
      <div role="status" data-testid="contact-success" className="ns-card px-6 py-10">
        <p className="font-display text-xl tracking-tight">{c.success}</p>
      </div>
    )
  }

  const fieldError = (key: string) => {
    if (!errors[key]) return undefined
    if (key === 'email') return c.errors.email
    if (key === 'message') return c.errors.message
    return c.errors.required
  }

  const nameError = fieldError('name')
  const emailError = fieldError('email')
  const messageError = fieldError('message')

  return (
    <form action={formAction} className="ns-card space-y-5 p-5 sm:p-8" data-testid="contact-form">
      <div>
        <label className={labelCls} htmlFor="ct_name">
          {c.name_label}
        </label>
        <input
          id="ct_name"
          name="name"
          required
          autoComplete="name"
          className="ns-input"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? nameErrId : undefined}
        />
        {nameError ? (
          <p id={nameErrId} className="mt-1 text-xs font-medium text-[var(--ns-danger)]" role="alert">
            {nameError}
          </p>
        ) : null}
      </div>
      <div>
        <label className={labelCls} htmlFor="ct_email">
          {c.email_label}
        </label>
        <input
          id="ct_email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="ns-input"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? emailErrId : undefined}
        />
        {emailError ? (
          <p id={emailErrId} className="mt-1 text-xs font-medium text-[var(--ns-danger)]" role="alert">
            {emailError}
          </p>
        ) : null}
      </div>
      <div>
        <label className={labelCls} htmlFor="ct_company">
          {c.company_label}
        </label>
        <input id="ct_company" name="company" autoComplete="organization" className="ns-input" />
      </div>
      <div>
        <label className={labelCls} htmlFor="ct_message">
          {c.message_label}
        </label>
        <textarea
          id="ct_message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          className="ns-input min-h-[9rem]"
          aria-invalid={Boolean(messageError)}
          aria-describedby={messageError ? messageErrId : undefined}
        />
        {messageError ? (
          <p id={messageErrId} className="mt-1 text-xs font-medium text-[var(--ns-danger)]" role="alert">
            {messageError}
          </p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} className="ns-btn-primary">
        {pending ? c.submitting : c.submit}
      </button>
      <p className="text-xs leading-relaxed text-[var(--ns-fg-dim)]">
        {c.privacy_note}{' '}
        <Link href={LEGAL_DOCUMENTS.privacy.href} className="underline underline-offset-4">
          {dict.site.waitlist.privacy_link}
        </Link>
        .
      </p>
    </form>
  )
}
