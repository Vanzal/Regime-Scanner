import { cookies } from 'next/headers'
import Link from 'next/link'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { SiteShell } from '@/components/site/site-shell'

export const dynamic = 'force-dynamic'

export default async function CookiesPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict: Dictionary = getDict(locale)
  const l = dict.site.legal
  const c = dict.site.cookie

  return (
    <SiteShell dict={dict} locale={locale}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{l.cookies_title}</h1>
        <p className="mt-3 text-sm text-[var(--ns-fg-muted)]">{l.cookies_intro}</p>
        <div className="mt-10 space-y-6" data-testid="cookie-policy">
          {l.cookies_body.map((section) => (
            <section key={section.h} className="border-t border-[var(--ns-border)] pt-5">
              <h2 className="text-base font-semibold tracking-tight">{section.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{section.b}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-[var(--ns-fg-muted)]">
          <Link
            href="/cookie-settings"
            className="underline decoration-[var(--ns-border-strong)] underline-offset-4 hover:text-[var(--ns-fg)]"
          >
            {c.settings_link}
          </Link>
        </p>
      </div>
    </SiteShell>
  )
}
