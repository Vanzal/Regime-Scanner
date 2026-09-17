import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteShell } from '@/components/site/site-shell'
import { CookieSettingsPanel } from '@/components/site/cookie-settings-panel'
import { publicPageMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = publicPageMeta('/cookie-settings', {
  title: 'Cookie settings',
  description: 'Manage optional cookies for NexusScope. Language and theme preferences stay on this device.',
})

export default async function CookieSettingsPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const c = dict.site.cookie

  return (
    <SiteShell dict={dict} locale={locale}>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-sm">
          <Link
            href="/cookies"
            className="text-[var(--ns-fg-muted)] underline decoration-[var(--ns-border)] underline-offset-4 hover:text-[var(--ns-fg)]"
          >
            {c.policy_link}
          </Link>
        </p>
        <h1 className="mt-6 font-display text-3xl tracking-tight sm:text-4xl">{c.settings_title}</h1>
        <div className="mt-8">
          <CookieSettingsPanel dict={dict} />
        </div>
      </div>
    </SiteShell>
  )
}
