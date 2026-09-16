import Link from 'next/link'
import type { Dictionary } from '@/i18n'
import { SubscribeCta } from '@/components/site/subscribe-cta'
import { CheckIcon } from '@/components/site/icons'
import { cn } from '@/lib/utils'

type PricingCopy = Dictionary['site']['pricing_page']
type SubscribeCopy = Dictionary['site']['subscribe']
type Plan = PricingCopy['plans'][number]

export function PricingPlans({
  copy,
  subscribe,
  productReady,
  pricingLive,
}: {
  copy: PricingCopy
  subscribe: SubscribeCopy
  productReady: boolean
  pricingLive: boolean
}) {
  return (
    <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
      {copy.plans.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          copy={copy}
          subscribe={subscribe}
          productReady={productReady}
          pricingLive={pricingLive}
        />
      ))}
    </div>
  )
}

function PricingCard({
  plan,
  copy,
  subscribe,
  productReady,
  pricingLive,
}: {
  plan: Plan
  copy: PricingCopy
  subscribe: SubscribeCopy
  productReady: boolean
  pricingLive: boolean
}) {
  const featured = plan.id === 'pro'
  const showCheckout = pricingLive && plan.id === 'pro'
  const href =
    plan.id === 'enterprise'
      ? '/contact'
      : plan.id === 'free' && productReady
        ? '/intake'
        : '/#waitlist'
  const cta =
    plan.id === 'enterprise'
      ? copy.contact_cta
      : plan.id === 'free' && productReady
        ? copy.scan_cta
        : plan.id === 'pro' && pricingLive
          ? copy.get_pro_cta
          : copy.waitlist_cta

  return (
    <article
      data-testid={`pricing-plan-${plan.id}`}
      className={cn(
        'ns-card relative flex flex-col p-6 sm:p-8',
        featured &&
          'border-[var(--ns-accent)] ring-1 ring-[color-mix(in_oklch,var(--ns-accent)_40%,transparent)] lg:-translate-y-1',
      )}
    >
      {plan.badge ? (
        <p
          data-testid="pricing-plan-badge"
          className="absolute -top-3 left-6 rounded-full border border-[var(--ns-accent)] bg-[var(--ns-bg-elevated)] px-3 py-1 font-instrument text-[10px] uppercase tracking-[0.14em] text-[var(--ns-accent)]"
        >
          {plan.badge}
        </p>
      ) : null}
      <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
      <p className="mt-4 font-display text-4xl tracking-tight">{plan.price}</p>
      <p className="mt-1 text-sm text-[var(--ns-fg-dim)]">{plan.cadence}</p>
      {plan.annual_price ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--ns-fg-muted)]">
          <span className="font-semibold text-[var(--ns-fg)]">
            {plan.annual_price} {plan.annual_cadence}
          </span>
          {plan.annual_save ? (
            <span className="mt-1 block text-[var(--ns-accent)]">{plan.annual_save}</span>
          ) : null}
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{plan.blurb}</p>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--ns-fg-muted)]">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ns-accent)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {showCheckout ? (
        <SubscribeCta copy={subscribe} compact cancelPath="/pricing" emailFieldId="pricing_sub_email" />
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          <Link href={href} className={featured ? 'ns-btn-primary w-full' : 'ns-btn-secondary w-full'}>
            {cta}
          </Link>
          {plan.id === 'enterprise' ? (
            <Link
              href="/#waitlist"
              className="text-center text-sm text-[var(--ns-fg-dim)] underline decoration-[var(--ns-border)] underline-offset-4 hover:text-[var(--ns-fg)]"
            >
              {copy.waitlist_cta}
            </Link>
          ) : null}
        </div>
      )}
    </article>
  )
}
