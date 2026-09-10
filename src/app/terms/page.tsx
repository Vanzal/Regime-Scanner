import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'
import { CookieBanner } from '@/components/site/cookie-banner'

export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.terms_title}</h1>
        <p className="font-reading mt-3 text-sm text-[var(--ns-fg-muted)]">{l.terms_intro}</p>

        {/* Final TOS content will be provided later */}
        <div className="mt-10 space-y-4 text-sm leading-relaxed" data-testid="terms-placeholder">
          <p className="font-reading text-[var(--ns-fg-dim)]">{l.tos_placeholder}</p>
          <p className="font-reading text-[var(--ns-fg-muted)]">{dict.site.footer.disclaimer}</p>
        </div>
      </main>
      <SiteFooter dict={dict} locale={locale} />
      <CookieBanner dict={dict} />
    </div>
  )
}
