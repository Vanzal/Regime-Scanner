'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  checkoutIntegrationId,
  ensureSubscriptionPrice,
  getStripe,
  siteUrl,
} from '@/lib/stripe'
import { getStore } from '@/lib/store'

export interface SubscribeState {
  ok: boolean
  errors?: Record<string, string>
}

const EmailSchema = z.string().trim().toLowerCase().email()

/** Start Stripe Checkout in subscription mode; redirects to hosted Checkout. */
export async function startSubscriptionCheckout(
  _prev: SubscribeState,
  fd: FormData,
): Promise<SubscribeState> {
  const parsed = EmailSchema.safeParse(fd.get('email'))
  if (!parsed.success) {
    return { ok: false, errors: { email: 'invalid' } }
  }
  const email = parsed.data

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === '[SENSITIVE]') {
    return { ok: false, errors: { form: 'stripe_unavailable' } }
  }

  try {
    const stripe = getStripe()
    const priceId = await ensureSubscriptionPrice()
    const base = siteUrl()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // Do NOT set payment_method_types — dynamic payment methods (Stripe best practice).
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#waitlist`,
      client_reference_id: email,
      metadata: { email, app: 'nexusscope', plan: 'early_access' },
      subscription_data: {
        metadata: { email, app: 'nexusscope', plan: 'early_access' },
      },
      integration_identifier: checkoutIntegrationId(),
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return { ok: false, errors: { form: 'checkout_failed' } }
    }
    redirect(session.url)
  } catch (err) {
    // Next.js redirect throws a special error — rethrow it.
    if (err && typeof err === 'object' && 'digest' in err) throw err
    console.error('[stripe] checkout failed', err)
    return { ok: false, errors: { form: 'checkout_failed' } }
  }
}

async function createPortalSession(
  email: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const sub = await getStore().getSubscriptionByEmail(email)
  if (!sub?.stripe_customer_id) {
    return { ok: false, error: 'no_subscription' }
  }
  const stripe = getStripe()
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl()}/billing/success`,
  })
  return { ok: true, url: portal.url }
}

/** Form action (no useActionState) for the success page portal button. */
export async function openBillingPortalForm(fd: FormData): Promise<void> {
  const parsed = EmailSchema.safeParse(fd.get('email'))
  if (!parsed.success) return
  try {
    const result = await createPortalSession(parsed.data)
    if (result.ok) redirect(result.url)
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err
    console.error('[stripe] portal failed', err)
  }
}

/** Open Stripe Customer Portal for the subscriber (by e-mail lookup). */
export async function openBillingPortal(
  _prev: SubscribeState,
  fd: FormData,
): Promise<SubscribeState> {
  const parsed = EmailSchema.safeParse(fd.get('email'))
  if (!parsed.success) {
    return { ok: false, errors: { email: 'invalid' } }
  }

  try {
    const result = await createPortalSession(parsed.data)
    if (!result.ok) return { ok: false, errors: { form: result.error } }
    redirect(result.url)
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err
    console.error('[stripe] portal failed', err)
    return { ok: false, errors: { form: 'portal_failed' } }
  }
}
