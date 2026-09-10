import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { startSubscriptionCheckout } from '@/app/actions/stripe'
import { resetStripeClient } from '@/lib/stripe'

describe('startSubscriptionCheckout without Stripe keys', () => {
  const prev = process.env.STRIPE_SECRET_KEY

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
    resetStripeClient()
  })

  afterEach(() => {
    if (prev === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = prev
    resetStripeClient()
  })

  it('returns stripe_unavailable when secret key is missing', async () => {
    const fd = new FormData()
    fd.set('email', 'ciso@firma.de')
    const res = await startSubscriptionCheckout({ ok: false }, fd)
    expect(res.ok).toBe(false)
    expect(res.errors?.form).toBe('stripe_unavailable')
  })

  it('rejects invalid email', async () => {
    const fd = new FormData()
    fd.set('email', 'not-an-email')
    const res = await startSubscriptionCheckout({ ok: false }, fd)
    expect(res.ok).toBe(false)
    expect(res.errors?.email).toBe('invalid')
  })
})
