import type Stripe from 'stripe'
import { getStore } from '@/lib/store'
import type { UpsertSubscriptionInput } from '@/lib/billing/types'

function periodEndIso(sub: Stripe.Subscription): string | null {
  const end = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end
  if (typeof end !== 'number') return null
  return new Date(end * 1000).toISOString()
}

function priceIdFromSub(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0]
  const price = item?.price
  if (!price) return null
  return typeof price === 'string' ? price : price.id
}

export async function upsertFromStripeSubscription(
  sub: Stripe.Subscription,
  emailHint?: string | null,
): Promise<void> {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  if (!customerId) return

  const email =
    emailHint?.trim().toLowerCase() ||
    (typeof sub.customer !== 'string' && sub.customer && !('deleted' in sub.customer && sub.customer.deleted)
      ? sub.customer.email?.toLowerCase()
      : null) ||
    sub.metadata?.email?.toLowerCase()
  if (!email) return

  const input: UpsertSubscriptionInput = {
    email,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceIdFromSub(sub),
    status: sub.status,
    current_period_end: periodEndIso(sub),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
  }
  await getStore().upsertSubscription(input)
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') return
      const subId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id
      if (!subId) return
      // Full subscription object may be expanded; otherwise webhook companion events update it.
      if (typeof session.subscription === 'object' && session.subscription) {
        await upsertFromStripeSubscription(
          session.subscription,
          session.customer_email || session.customer_details?.email || session.metadata?.email,
        )
      } else {
        const email =
          session.customer_email ||
          session.customer_details?.email ||
          session.metadata?.email ||
          null
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id
        if (email && customerId) {
          await getStore().upsertSubscription({
            email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            stripe_price_id: null,
            status: 'active',
            current_period_end: null,
            cancel_at_period_end: false,
          })
        }
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await upsertFromStripeSubscription(sub, sub.metadata?.email)
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subRef =
        (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
          .subscription
      const subId = typeof subRef === 'string' ? subRef : subRef?.id
      if (!subId) return
      if (typeof subRef === 'object' && subRef) {
        await upsertFromStripeSubscription(
          subRef,
          invoice.customer_email || invoice.metadata?.email,
        )
      }
      break
    }
    default:
      break
  }
}
