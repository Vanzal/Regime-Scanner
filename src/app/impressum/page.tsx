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
    <div className="bg-[#0B1120] text-slate-200">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{l.impressum_title}</h1>
        <p className="mt-3 text-sm text-slate-400">{l.impressum_intro}</p>

        <dl className="mt-10 space-y-6 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold text-slate-300">{l.operator}</dt>
            <dd className="mt-1 text-slate-400">{l.placeholder}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-300">{l.representative}</dt>
            <dd className="mt-1 text-slate-400">{l.placeholder}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-300">{l.contact}</dt>
            <dd className="mt-1 text-slate-400">
              <a href={`mailto:${dict.site.footer.contact_email}`} className="text-cyan-300 hover:underline">
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
