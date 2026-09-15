import { notFound } from 'next/navigation'
import { ReportView } from '@/components/report/report-view'
import { getDict, type Locale } from '@/i18n'
import { loadReport, loadReportPendingState } from '@/lib/report/data'
import { localeFromCookie } from '@/i18n'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function ReportPage({
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

  const data = await loadReport(token)
  if (data) {
    return (
      <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
        <ReportView data={data} dict={dict} token={token} showChrome={print !== '1'} />
      </div>
    )
  }

  // Token bekannt, Bericht noch nicht freigegeben (Pilotmodus)?
  const pending = await loadReportPendingState(token)
  if (pending) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center text-[var(--ns-fg)]">
        <h1 className="text-xl font-bold">{dict.report.pending}</h1>
        <p className="mt-3 text-sm text-[var(--ns-fg-muted)]">{dict.report.pending_text}</p>
      </main>
    )
  }

  // Unbekannter Token → 404 (nie 403, kein Token-Probing-Beweis)
  notFound()
}
