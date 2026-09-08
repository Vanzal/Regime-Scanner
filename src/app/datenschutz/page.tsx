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
    <div className="min-h-screen bg-[var(--ns-bg)] text-slate-200">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{l.datenschutz_title}</h1>
        <p className="mt-3 text-sm text-slate-400">{l.datenschutz_intro}</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed">
          {l.privacy_sections.map((section, i) => (
            <section key={i} data-testid={`privacy-section-${i + 1}`}>
              <h2 className="font-semibold text-slate-300">{section.h}</h2>
              <p className="mt-1 text-slate-400">{section.b}</p>
            </section>
          ))}
          <p className="text-slate-500">{l.placeholder}</p>
        </div>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </div>
  )
}
