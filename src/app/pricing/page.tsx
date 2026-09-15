import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { isPricingLive, isProductReady } from '@/lib/flags'
import { SiteShell } from '@/components/site/site-shell'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'NexusScope plans: Free (1 report / month), Pro (unlimited + team), Enterprise / Agency. Waitlist is open now.',
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
        <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
          {pricingLive ? dict.site.nav.pricing : p.coming_soon}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">{p.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ns-fg-muted)]">{p.subtitle}</p>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {p.plans.map((plan) => {
            const featured = plan.id === 'pro'
            const href = plan.id === 'free' && productReady ? '/intake' : '/#waitlist'
            const cta = plan.id === 'free' && productReady ? p.scan_cta : p.waitlist_cta
            return (
              <article
                key={plan.id}
                data-testid={`pricing-plan-${plan.id}`}
                className={cn(
                  'ns-card flex flex-col p-6',
                  featured && 'border-[var(--ns-accent)] ring-1 ring-[color-mix(in_oklch,var(--ns-accent)_40%,transparent)]',
                )}
              >
                <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
                <p className="mt-3 font-display text-3xl tracking-tight">{plan.price}</p>
                <p className="mt-1 text-sm text-[var(--ns-fg-dim)]">{plan.cadence}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{plan.blurb}</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-[var(--ns-fg-muted)]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="border-t border-[var(--ns-border)] pt-2">
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={href} className={featured ? 'ns-btn-primary mt-8 w-full' : 'ns-btn-secondary mt-8 w-full'}>
                  {pricingLive && plan.id === 'pro' ? p.waitlist_cta : cta}
                </Link>
              </article>
            )
          })}
        </div>

        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-[var(--ns-fg-dim)]">
          {p.note} {p.footnote}
        </p>
      </div>
    </SiteShell>
  )
}
