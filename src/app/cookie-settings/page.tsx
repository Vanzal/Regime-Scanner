import { cookies } from 'next/headers'
import Link from 'next/link'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'
import { CookieSettingsPanel } from '@/components/site/cookie-settings-panel'

export const dynamic = 'force-dynamic'

export default async function CookieSettingsPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const c = dict.site.cookie

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <header className="border-b border-[var(--ns-border)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-sm tracking-tight sm:text-base">
            NexusScope
          </Link>
          <Link
            href="/cookies"
            className="text-xs text-[var(--ns-fg-muted)] underline decoration-[var(--ns-border)] underline-offset-4 hover:text-[var(--ns-fg)]"
          >
            {c.policy_link}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{c.settings_title}</h1>
        <div className="mt-8">
          <CookieSettingsPanel dict={dict} />
        </div>
      </main>

      <SiteFooter dict={dict} locale={locale} />
      {/* Banner omitted here — this page is the consent UI itself. */}
    </div>
  )
}
