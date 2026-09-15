import { cookies } from 'next/headers'
import Link from 'next/link'
import { getDict, localeFromCookie, t, type Locale } from '@/i18n'
import { isProductReady } from '@/lib/flags'
import { IntakeForm } from './intake-form'
import { SiteShell } from '@/components/site/site-shell'

export const dynamic = 'force-dynamic'

export default async function IntakePage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const productReady = isProductReady()

  return (
    <SiteShell dict={dict} locale={locale} productReady={productReady}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-accent)]">
          {dict.app.name}
        </p>
        <h1 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">{t(dict, 'intake.title')}</h1>
        <p className="mt-2 text-sm text-[var(--ns-fg-muted)]">{t(dict, 'intake.subtitle')}</p>
        {productReady ? null : (
          <div className="ns-card mt-6 p-4 text-sm leading-relaxed text-[var(--ns-fg-muted)]">
            <p>{dict.site.scan_gate.body}</p>
            <Link href="/#waitlist" className="mt-3 inline-flex font-semibold text-[var(--ns-accent)] underline-offset-4 hover:underline">
              {dict.site.scan_gate.link}
            </Link>
          </div>
        )}
        <div className="mt-8">
          <IntakeForm dict={dict} />
        </div>
      </div>
    </SiteShell>
  )
}
