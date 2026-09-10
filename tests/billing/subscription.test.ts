import { describe, expect, it, beforeAll, afterEach } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { resetStore, getStore } from '@/lib/store'
import { handleStripeEvent } from '@/lib/billing/webhook'
import type Stripe from 'stripe'

beforeAll(() => {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `nexusscope-billing-${Date.now()}.json`)
  // Force file store
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  resetStore()
})

afterEach(() => {
  resetStore()
})

function readSubs() {
  if (!fs.existsSync(process.env.LOCAL_DB_PATH!)) return []
  return JSON.parse(fs.readFileSync(process.env.LOCAL_DB_PATH!, 'utf8')).subscriptions ?? []
}

describe('Stripe subscription store + webhook handler', () => {
  it('upsertSubscription is idempotent by stripe_subscription_id', async () => {
    const store = getStore()
    const first = await store.upsertSubscription({
      email: 'CISO@Beispiel.de',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      stripe_price_id: 'price_1',
      status: 'active',
      current_period_end: '2026-10-10T00:00:00.000Z',
    })
    expect(first.email).toBe('ciso@beispiel.de')

    const second = await store.upsertSubscription({
      email: 'ciso@beispiel.de',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      status: 'past_due',
      cancel_at_period_end: true,
    })
    expect(second.id).toBe(first.id)
    expect(second.status).toBe('past_due')
    expect(second.cancel_at_period_end).toBe(true)
    expect(readSubs()).toHaveLength(1)
  })

  it('checkout.session.completed persists a subscription row', async () => {
    const event = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          customer: 'cus_checkout',
          customer_email: 'lead@firma.de',
          subscription: 'sub_checkout',
          metadata: { email: 'lead@firma.de' },
        },
      },
    } as unknown as Stripe.Event

    await handleStripeEvent(event)
    const row = await getStore().getSubscriptionByEmail('lead@firma.de')
    expect(row?.stripe_subscription_id).toBe('sub_checkout')
    expect(row?.stripe_customer_id).toBe('cus_checkout')
    expect(row?.status).toBe('active')
  })

  it('customer.subscription.updated refreshes status', async () => {
    await getStore().upsertSubscription({
      email: 'ops@firma.at',
      stripe_customer_id: 'cus_2',
      stripe_subscription_id: 'sub_2',
      status: 'active',
    })

    const event = {
      id: 'evt_2',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_2',
          customer: 'cus_2',
          status: 'canceled',
          cancel_at_period_end: false,
          current_period_end: 1_800_000_000,
          metadata: { email: 'ops@firma.at' },
          items: { data: [{ price: { id: 'price_x' } }] },
        },
      },
    } as unknown as Stripe.Event

    await handleStripeEvent(event)
    const row = await getStore().getSubscriptionByStripeId('sub_2')
    expect(row?.status).toBe('canceled')
    expect(row?.stripe_price_id).toBe('price_x')
    expect(row?.current_period_end).toBe(new Date(1_800_000_000 * 1000).toISOString())
  })
})
