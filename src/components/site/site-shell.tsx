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
  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <SiteHeader dict={dict} locale={locale} productReady={productReady} />
      {children}
      <SiteFooter dict={dict} locale={locale} />
      <DeferredCookieBanner copy={dict.site.cookie} />
    </div>
  )
}
