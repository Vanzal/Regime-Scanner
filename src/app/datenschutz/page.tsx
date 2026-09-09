import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'

export const dynamic = 'force-dynamic'

export default async function DatenschutzPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.datenschutz_title}</h1>
        <p className="font-reading mt-3 text-sm text-[var(--ns-fg-muted)]">{l.datenschutz_intro}</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed">
          {l.privacy_sections.map((section, i) => (
            <section key={i} data-testid={`privacy-section-${i + 1}`}>
              <h2 className="font-semibold">{section.h}</h2>
              <p className="font-reading mt-1 text-[var(--ns-fg-muted)]">{section.b}</p>
            </section>
          ))}
          <p className="font-reading text-[var(--ns-fg-dim)]">{l.placeholder}</p>
        </div>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </div>
  )
}
