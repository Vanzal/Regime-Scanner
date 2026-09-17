import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDict } from '@/i18n'
import { PricingPlans } from '@/components/site/pricing-plans'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('pricing plans', () => {
  it('shows published Free, Pro, and Enterprise amounts in EN', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(
      <PricingPlans
        copy={dict.site.pricing_page}
        subscribe={dict.site.subscribe}
        productReady={false}
        pricingLive={false}
      />,
    )

    expect(html).toContain('data-testid="pricing-plan-free"')
    expect(html).toContain('data-testid="pricing-plan-pro"')
    expect(html).toContain('data-testid="pricing-plan-enterprise"')
    expect(html).toContain('€0')
    expect(html).toContain('€99')
    expect(html).toContain('€990')
    expect(html).toContain('Save €198 — 2 months free')
    expect(html).toContain('Most popular')
    expect(html).toContain('From €299 / month')
    expect(html).toContain('Join waitlist')
    expect(html).toContain('Contact us')
    expect(html).toContain('href="/#waitlist"')
    expect(html).toContain('href="/contact"')
    expect(html).not.toContain('Coming soon')
    expect(html).not.toContain('> — <')
  })

  it('shows DE copy, prices, and waitlist CTAs', () => {
    const dict = getDict('de')
    const html = renderToStaticMarkup(
      <PricingPlans
        copy={dict.site.pricing_page}
        subscribe={dict.site.subscribe}
        productReady={false}
        pricingLive={false}
      />,
    )

    expect(html).toContain('€99')
    expect(html).toContain('€990')
    expect(html).toContain('Am beliebtesten')
    expect(html).toContain('Auf die Warteliste')
    expect(html).toContain('Kontakt')
    expect(html).not.toContain('Demnächst')
  })

  it('uses Get Pro checkout when pricing is live', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(
      <PricingPlans
        copy={dict.site.pricing_page}
        subscribe={dict.site.subscribe}
        productReady={false}
        pricingLive={true}
      />,
    )

    expect(html).toContain('data-testid="subscribe-cta"')
    expect(html).toContain('Subscribe with Stripe')
  })
})
