import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { LangSwitch } from '@/components/site/lang-switch'
import { IncidentForm } from './incident-form'

export const dynamic = 'force-dynamic'

export default async function IncidentPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{dict.app.name}</p>
        <LangSwitch locale={locale} label="Language" variant="light" />
      </div>
      <p className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-300/60">
        {dict.incident.badge}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{dict.incident.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{dict.incident.subtitle}</p>
      <div className="mt-8">
        <IncidentForm dict={dict} />
      </div>
    </main>
  )
}
