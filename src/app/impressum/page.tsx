import Link from 'next/link'
import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteShell } from '@/components/site/site-shell'

export const dynamic = 'force-dynamic'

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default async function ImpressumPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal
  const f = dict.site.footer
  const email = f.contact_email?.trim() ?? ''
  const phone = f.phone?.trim()
  const uid = f.uid?.trim()

  return (
    <SiteShell dict={dict} locale={locale}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.impressum_title}</h1>
        <p className="mt-3 text-sm text-[var(--ns-fg-muted)]">{l.impressum_intro}</p>

        <dl className="mt-10 space-y-6 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">{l.operator}</dt>
            <dd className="mt-1 text-[var(--ns-fg-muted)]">
              {f.company_name}
              <br />
              {f.legal_form}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">{l.representative}</dt>
            <dd className="mt-1 text-[var(--ns-fg-muted)]">{f.operator_name || l.placeholder}</dd>
          </div>
          <div>
            <dt className="font-semibold">{l.contact}</dt>
            <dd className="mt-1 space-y-1 text-[var(--ns-fg-muted)]">
              <address className="not-italic">
                {f.address_lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p>
                {f.email_label}:{' '}
                {looksLikeEmail(email) ? (
                  <a
                    href={`mailto:${email}`}
                    className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]"
                  >
                    {email}
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]"
                  >
                    {f.contact_form_label ?? f.contact}
                  </Link>
                )}
              </p>
              {phone ? (
                <p>
                  {f.phone_label}: {phone}
                </p>
              ) : null}
              {uid ? (
                <p>
                  {f.uid_label}: {uid}
                </p>
              ) : null}
            </dd>
          </div>
        </dl>

        <p className="mt-10 text-sm text-[var(--ns-fg-muted)]">{f.disclaimer}</p>
      </div>
    </SiteShell>
  )
}
