import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createSession = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`) as Error & { digest: string }
    err.digest = `NEXT_REDIRECT;${url}`
    throw err
  },
}))

vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe')>('@/lib/stripe')
  return {
    ...actual,
    ensureSubscriptionPrice: vi.fn(async () => 'price_test'),
    checkoutIntegrationId: () => 'nexusscope-sub-testxxxx',
    siteUrl: () => 'http://localhost:3000',
    getStripe: () =>
      ({
        checkout: {
          sessions: {
            create: createSession,
          },
        },
      }) as unknown as ReturnType<typeof actual.getStripe>,
  }
})

import { startSubscriptionCheckout } from '@/app/actions/stripe'

describe('startSubscriptionCheckout creates a Checkout Session', () => {
  const prevKey = process.env.STRIPE_SECRET_KEY

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    createSession.mockReset()
    createSession.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test_123' })
  })

  afterEach(() => {
    if (prevKey === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = prevKey
  })

  it('redirects to the hosted Checkout URL and omits payment_method_types', async () => {
    const fd = new FormData()
    fd.set('email', 'CISO@Firma.de')

    await expect(startSubscriptionCheckout({ ok: false }, fd)).rejects.toMatchObject({
      digest: 'NEXT_REDIRECT;https://checkout.stripe.com/c/pay/cs_test_123',
    })

    expect(createSession).toHaveBeenCalledTimes(1)
    const params = createSession.mock.calls[0]?.[0] as Record<string, unknown>
    expect(params.mode).toBe('subscription')
    expect(params.customer_email).toBe('ciso@firma.de')
    expect(params.cancel_url).toBe('http://localhost:3000/#waitlist')
    expect(params).not.toHaveProperty('payment_method_types')
    expect(params.line_items).toEqual([{ price: 'price_test', quantity: 1 }])
  })

  it('sends cancel_url back to /pricing when the form asks', async () => {
    const fd = new FormData()
    fd.set('email', 'ciso@firma.de')
    fd.set('cancel_path', '/pricing')

    await expect(startSubscriptionCheckout({ ok: false }, fd)).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT;'),
    })

    const params = createSession.mock.calls[0]?.[0] as Record<string, unknown>
    expect(params.cancel_url).toBe('http://localhost:3000/pricing')
  })
})
