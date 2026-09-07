import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { getStore } from '@/lib/store'
import { ScanStatusPanel } from './scan-status'

export const dynamic = 'force-dynamic'

export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ scanId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { scanId } = await params
  const sp = await searchParams
  const token = typeof sp.t === 'string' ? sp.t : ''
  const sent = sp.sent === '1'
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)

  // Token ist die Berechtigung – Scan-ID allein öffnet nichts.
  const store = getStore()
  const lead = await store.getLeadByToken(token)
  const scan = await store.getScan(scanId)
  if (!lead || !scan || lead.company_id !== scan.company_id) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <ScanStatusPanel scanId={scanId} reportToken={token} emailSent={sent} dict={dict} />
    </main>
  )
}
