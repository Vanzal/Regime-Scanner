import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getStore } from '@/lib/store'
import type { UpsertSubscriptionInput } from '@/lib/billing/types'

/** Events the setup endpoint registers (and updates on existing endpoints). */
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
] as const satisfies readonly Stripe.WebhookEndpointCreateParams.EnabledEvent[]

export type RetrieveSubscription = (id: string) => Promise<Stripe.Subscription>

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

function sessionEmail(session: Stripe.Checkout.Session): string | null {
  return session.customer_email || session.customer_details?.email || session.metadata?.email || null
}

function sessionCustomerId(session: Stripe.Checkout.Session): string | null {
  return typeof session.customer === 'string' ? session.customer : session.customer?.id || null
}

function sessionSubscriptionId(session: Stripe.Checkout.Session): string | null {
  if (!session.subscription) return null
  return typeof session.subscription === 'string' ? session.subscription : session.subscription.id
}

/** Stripe Invoice.subscription moved under parent.subscription_details on recent API versions. */
function invoiceSubscriptionRef(
  invoice: Stripe.Invoice,
): string | Stripe.Subscription | null {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription
  if (legacy) return legacy
  const parent = (
    invoice as Stripe.Invoice & {
      parent?: { subscription_details?: { subscription?: string | Stripe.Subscription | null } } | null
    }
  ).parent
  return parent?.subscription_details?.subscription ?? null
}

async function loadSubscription(
  id: string,
  retrieve?: RetrieveSubscription,
): Promise<Stripe.Subscription | null> {
  try {
    if (retrieve) return await retrieve(id)
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === '[SENSITIVE]') {
      return null
    }
    return await getStripe().subscriptions.retrieve(id)
  } catch (err) {
    console.error('[stripe] subscription retrieve failed', err)
    return null
  }
}

async function persistCheckoutSession(
  session: Stripe.Checkout.Session,
  retrieve?: RetrieveSubscription,
): Promise<void> {
  if (session.mode !== 'subscription') return
  // Delayed methods fire `completed` while still unpaid — wait for async_payment_succeeded.
  if (session.payment_status === 'unpaid') return

  const email = sessionEmail(session)
  const subRef = session.subscription
  const subId = sessionSubscriptionId(session)
  if (!subId) return

  if (typeof subRef === 'object' && subRef) {
    await upsertFromStripeSubscription(subRef, email)
    return
  }

  const loaded = await loadSubscription(subId, retrieve)
  if (loaded) {
    await upsertFromStripeSubscription(loaded, email)
    return
  }

  const customerId = sessionCustomerId(session)
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

async function persistInvoice(
  invoice: Stripe.Invoice,
  retrieve?: RetrieveSubscription,
): Promise<void> {
  const ref = invoiceSubscriptionRef(invoice)
  const subId = typeof ref === 'string' ? ref : ref?.id
  if (!subId) return

  const email = invoice.customer_email || invoice.metadata?.email || null
  if (typeof ref === 'object' && ref) {
    await upsertFromStripeSubscription(ref, email)
    return
  }

  const loaded = await loadSubscription(subId, retrieve)
  if (loaded) {
    await upsertFromStripeSubscription(loaded, email)
  }
}

export async function handleStripeEvent(
  event: Stripe.Event,
  retrieve?: RetrieveSubscription,
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      await persistCheckoutSession(event.data.object as Stripe.Checkout.Session, retrieve)
      break
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') return
      const subId = sessionSubscriptionId(session)
      if (!subId) return
      const loaded = await loadSubscription(subId, retrieve)
      if (loaded) {
        await upsertFromStripeSubscription(loaded, sessionEmail(session))
        return
      }
      const email = sessionEmail(session)
      const customerId = sessionCustomerId(session)
      if (email && customerId) {
        await getStore().upsertSubscription({
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          stripe_price_id: null,
          status: 'incomplete',
          current_period_end: null,
          cancel_at_period_end: false,
        })
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
      await persistInvoice(event.data.object as Stripe.Invoice, retrieve)
      break
    }
    default:
      break
  }
}
