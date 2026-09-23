import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import {
  SITE_GATE_COOKIE,
  isSiteGateEnabled,
  safeNextPath,
  verifySiteGateCookie,
} from '@/lib/site-gate'
import { EnterForm } from './enter-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Enter',
  robots: { index: false, follow: false },
}

export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  if (!isSiteGateEnabled()) redirect('/')

  const params = await searchParams
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next
  const next = safeNextPath(nextRaw)

  const cookieStore = await cookies()
  if (await verifySiteGateCookie(cookieStore.get(SITE_GATE_COOKIE)?.value)) {
    redirect(next)
  }

  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const g = dict.site.gate

  return (
    <EnterForm
      next={next}
      locale={locale}
      langLabel={dict.site.footer.lang_label}
      themeLabel={dict.site.theme.toggle}
      title={g.title}
      body={g.body}
      placeholder={g.placeholder}
      submit={g.submit}
      error={g.error}
    />
  )
}
