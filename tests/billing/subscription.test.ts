import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { resetStore, getStore } from '@/lib/store'
import { handleStripeEvent, STRIPE_WEBHOOK_EVENTS } from '@/lib/billing/webhook'
import type Stripe from 'stripe'

const prevStripeKey = process.env.STRIPE_SECRET_KEY

beforeAll(() => {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `nexusscope-billing-${Date.now()}.json`)
  // Force file store; keep Stripe retrieve offline unless a test injects it.
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.STRIPE_SECRET_KEY
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

  it('does not fulfill checkout.session.completed while payment_status is unpaid', async () => {
    const event = {
      id: 'evt_unpaid',
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          payment_status: 'unpaid',
          customer: 'cus_async',
          customer_email: 'async@firma.de',
          subscription: 'sub_async',
        },
      },
    } as unknown as Stripe.Event

    await handleStripeEvent(event)
    expect(await getStore().getSubscriptionByEmail('async@firma.de')).toBeNull()
  })

  it('checkout.session.async_payment_succeeded fulfills after delayed payment', async () => {
    const event = {
      id: 'evt_async_ok',
      type: 'checkout.session.async_payment_succeeded',
      data: {
        object: {
          mode: 'subscription',
          payment_status: 'paid',
          customer: 'cus_async_ok',
          customer_email: 'paid@firma.de',
          subscription: 'sub_async_ok',
        },
      },
    } as unknown as Stripe.Event

    await handleStripeEvent(event)
    const row = await getStore().getSubscriptionByEmail('paid@firma.de')
    expect(row?.stripe_subscription_id).toBe('sub_async_ok')
    expect(row?.status).toBe('active')
  })

  it('invoice.paid with a subscription id retrieves and upserts', async () => {
    const retrieve = vi.fn(async (id: string) => {
      expect(id).toBe('sub_inv')
      return {
        id: 'sub_inv',
        customer: 'cus_inv',
        status: 'active',
        cancel_at_period_end: false,
        current_period_end: 1_800_000_000,
        metadata: { email: 'invoice@firma.de' },
        items: { data: [{ price: { id: 'price_inv' } }] },
      } as unknown as Stripe.Subscription
    })

    const event = {
      id: 'evt_inv',
      type: 'invoice.paid',
      data: {
        object: {
          customer_email: 'invoice@firma.de',
          subscription: 'sub_inv',
        },
      },
    } as unknown as Stripe.Event

    await handleStripeEvent(event, retrieve)
    expect(retrieve).toHaveBeenCalledWith('sub_inv')
    const row = await getStore().getSubscriptionByStripeId('sub_inv')
    expect(row?.status).toBe('active')
    expect(row?.stripe_price_id).toBe('price_inv')
    expect(row?.email).toBe('invoice@firma.de')
  })

  it('invoice.payment_failed reads subscription from parent.subscription_details', async () => {
    const retrieve = vi.fn(async () => {
      return {
        id: 'sub_parent',
        customer: 'cus_parent',
        status: 'past_due',
        cancel_at_period_end: false,
        metadata: { email: 'parent@firma.de' },
        items: { data: [] },
      } as unknown as Stripe.Subscription
    })

    const event = {
      id: 'evt_parent',
      type: 'invoice.payment_failed',
      data: {
        object: {
          parent: { subscription_details: { subscription: 'sub_parent' } },
        },
      },
    } as unknown as Stripe.Event

    await handleStripeEvent(event, retrieve)
    const row = await getStore().getSubscriptionByStripeId('sub_parent')
    expect(row?.status).toBe('past_due')
  })

  it('registers async Checkout webhook events', () => {
    expect(STRIPE_WEBHOOK_EVENTS).toContain('checkout.session.async_payment_succeeded')
    expect(STRIPE_WEBHOOK_EVENTS).toContain('checkout.session.async_payment_failed')
  })
})

afterAll(() => {
  if (prevStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY
  else process.env.STRIPE_SECRET_KEY = prevStripeKey
})
