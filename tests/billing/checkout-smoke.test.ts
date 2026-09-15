import { describe, expect, it } from 'vitest'
import { ensureSubscriptionPrice, getStripe, resetStripeClient } from '@/lib/stripe'

const key = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
const hasSandbox =
  key !== '' &&
  key !== '[SENSITIVE]' &&
  (key.startsWith('sk_test_') || key.startsWith('rk_test_')) &&
  Boolean(process.env.STRIPE_PRICE_ID?.trim() || process.env.STRIPE_UNIT_AMOUNT_CENTS?.trim())

describe.skipIf(!hasSandbox)('Stripe sandbox Checkout smoke', () => {
  it('creates a subscription Checkout Session', async () => {
    resetStripeClient()
    const stripe = getStripe()
    const priceId = await ensureSubscriptionPrice()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: 'smoke@example.com',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/pricing',
      integration_identifier: 'nexusscope-sub-smoketest',
    })
    expect(session.url).toMatch(/^https:\/\/checkout\.stripe\.com\//)
    expect(session.mode).toBe('subscription')
  })
})
