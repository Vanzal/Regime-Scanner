import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { isPricingLive, isProductReady } from '@/lib/flags'
import { SiteShell } from '@/components/site/site-shell'
import { PricingPlans } from '@/components/site/pricing-plans'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'NexusScope plans: Free (€0, 1 report / month), Pro (€99 / month or €990 / year), Enterprise / Agency from €299 / month. Waitlist is open now.',
}

export default async function PricingPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const p = dict.site.pricing_page
  const productReady = isProductReady()
  const pricingLive = isPricingLive()

  return (
    <SiteShell dict={dict} locale={locale} productReady={productReady}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p
          data-testid="pricing-eyebrow"
          className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]"
        >
          {dict.site.nav.pricing}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">{p.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ns-fg-muted)]">
          {pricingLive ? p.subtitle_live : p.subtitle}
        </p>

        <PricingPlans
          copy={p}
          subscribe={dict.site.subscribe}
          productReady={productReady}
          pricingLive={pricingLive}
        />

        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-[var(--ns-fg-dim)]">
          {p.note} {p.footnote}
        </p>
      </div>
    </SiteShell>
  )
}
