import type { Dictionary, Locale } from '@/i18n'
import { isProductReady } from '@/lib/flags'
import { DeferredCookieBanner } from './deferred-cookie-banner'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export function SiteShell({
  dict,
  locale,
  children,
  productReady = isProductReady(),
}: {
  dict: Dictionary
  locale: Locale
  children: React.ReactNode
  productReady?: boolean
}) {
  const skipLabel = locale === 'de' ? 'Zum Inhalt springen' : 'Skip to content'

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <a href="#main-content" className="ns-skip-link">
        {skipLabel}
      </a>
      <SiteHeader dict={dict} locale={locale} productReady={productReady} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter dict={dict} locale={locale} />
      <DeferredCookieBanner copy={dict.site.cookie} />
    </div>
  )
}
