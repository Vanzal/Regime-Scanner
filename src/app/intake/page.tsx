import { cookies } from 'next/headers'
import { getDict, localeFromCookie, t, type Locale } from '@/i18n'
import { IntakeForm } from './intake-form'

export const dynamic = 'force-dynamic'

export default async function IntakePage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{dict.app.name}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{t(dict, 'intake.title')}</h1>
      <p className="mt-2 text-sm text-slate-600">{t(dict, 'intake.subtitle')}</p>
      <div className="mt-8">
        <IntakeForm dict={dict} />
      </div>
    </main>
  )
}
