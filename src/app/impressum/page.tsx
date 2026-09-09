import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'

export const dynamic = 'force-dynamic'

export default async function ImpressumPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.impressum_title}</h1>
        <p className="font-reading mt-3 text-sm text-[var(--ns-fg-muted)]">{l.impressum_intro}</p>

        <dl className="mt-10 space-y-6 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">{l.operator}</dt>
            <dd className="font-reading mt-1 text-[var(--ns-fg-muted)]">{l.placeholder}</dd>
          </div>
          <div>
            <dt className="font-semibold">{l.representative}</dt>
            <dd className="font-reading mt-1 text-[var(--ns-fg-muted)]">{l.placeholder}</dd>
          </div>
          <div>
            <dt className="font-semibold">{l.contact}</dt>
            <dd className="mt-1 text-[var(--ns-fg-muted)]">
              <a href={`mailto:${dict.site.footer.contact_email}`} className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]">
                {dict.site.footer.contact_email}
              </a>
            </dd>
          </div>
        </dl>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </div>
  )
}
