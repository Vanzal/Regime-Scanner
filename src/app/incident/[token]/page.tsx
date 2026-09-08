import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { getIncidentByToken } from '@/lib/incident'
import { IncidentTriageView } from '@/components/incident/triage-view'
import { LangSwitch } from '@/components/site/lang-switch'

export const dynamic = 'force-dynamic'

export default async function IncidentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { token } = await params
  const { print } = await searchParams
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)

  const record = getIncidentByToken(token)
  if (!record) notFound()

  return (
    <>
      {print !== '1' && (
        <div className="no-print mx-auto flex max-w-4xl items-center justify-end px-4 pt-6 sm:px-6">
          <LangSwitch locale={locale} label="Language" variant="light" />
        </div>
      )}
      <IncidentTriageView record={record} dict={dict} showChrome={print !== '1'} />
    </>
  )
}
