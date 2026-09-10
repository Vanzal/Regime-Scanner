import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'
import { CookieBanner } from '@/components/site/cookie-banner'

export const dynamic = 'force-dynamic'

export default async function ImpressumPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal
  const f = dict.site.footer

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.impressum_title}</h1>
        <p className="font-reading mt-3 text-sm text-[var(--ns-fg-muted)]">{l.impressum_intro}</p>

        <dl className="mt-10 space-y-6 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">{l.operator}</dt>
            {/* Exact company legal name & form — replace before go-live */}
            <dd className="font-reading mt-1 text-[var(--ns-fg-muted)]">
              {f.company_name}
              <br />
              {f.legal_form}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">{l.representative}</dt>
            <dd className="font-reading mt-1 text-[var(--ns-fg-muted)]">{l.placeholder}</dd>
          </div>
          <div>
            <dt className="font-semibold">{l.contact}</dt>
            <dd className="font-reading mt-1 space-y-1 text-[var(--ns-fg-muted)]">
              {/* Full Swiss postal address — replace before go-live */}
              <address className="not-italic">
                {f.address_lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p>
                {f.email_label}:{' '}
                <a
                  href={`mailto:${f.contact_email}`}
                  className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]"
                >
                  {f.contact_email}
                </a>
              </p>
              {/* Optional phone — replace or remove before go-live */}
              <p>
                {f.phone_label}: {f.phone}
              </p>
              {/* UID / VAT — replace if applicable */}
              <p>
                {f.uid_label}: {f.uid}
              </p>
            </dd>
          </div>
        </dl>

        <p className="font-reading mt-10 text-sm text-[var(--ns-fg-muted)]">{f.disclaimer}</p>
      </main>
      <SiteFooter dict={dict} locale={locale} />
      <CookieBanner dict={dict} />
    </div>
  )
}
