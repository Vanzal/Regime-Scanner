import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { handleStripeEvent } from '@/lib/billing/webhook'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Stripe webhook — signature-verified; fulfills subscription lifecycle. */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || secret === '[SENSITIVE]') {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  const rawBody = await req.text()
  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[stripe] webhook signature failed', err)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  try {
    await handleStripeEvent(event)
  } catch (err) {
    console.error('[stripe] webhook handler failed', err)
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
