import { cookies } from 'next/headers'
import Link from 'next/link'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'
import { CookieBanner } from '@/components/site/cookie-banner'

export const dynamic = 'force-dynamic'

/** Cookie Policy — route reserved; body intentionally empty until final text. */
export default async function CookiesPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal
  const c = dict.site.cookie

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.cookies_title}</h1>
        {/* Final Cookie Policy text will be provided later — page left empty on purpose. */}
        <div className="mt-10 min-h-[12rem]" data-testid="cookie-policy-empty" aria-hidden />
        <p className="font-reading text-sm text-[var(--ns-fg-muted)]">
          <Link
            href="/cookie-settings"
            className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]"
          >
            {c.settings_link}
          </Link>
        </p>
      </main>
      <SiteFooter dict={dict} locale={locale} />
      <CookieBanner dict={dict} />
    </div>
  )
}
