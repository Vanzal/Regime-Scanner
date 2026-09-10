import { NextResponse } from 'next/server'
import {
  ensureSubscriptionPrice,
  getStripe,
  PRICE_LOOKUP_KEY,
  siteUrl,
} from '@/lib/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * One-shot bootstrap (admin-protected): ensure Price exists and register webhook.
 * POST with header `x-admin-setup: <ADMIN_PASSWORD>`.
 * Returns price id + webhook id; webhook signing secret only when newly created.
 */
export async function POST(req: Request): Promise<Response> {
  const expected = process.env.ADMIN_PASSWORD
  const provided = req.headers.get('x-admin-setup')
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const priceId = await ensureSubscriptionPrice()
    const stripe = getStripe()
    const base = siteUrl()
    const endpointUrl = `${base}/api/stripe/webhook`

    const existing = await stripe.webhookEndpoints.list({ limit: 100 })
    const found = existing.data.find((w) => w.url === endpointUrl)

    let webhook: {
      id: string
      url: string
      secret?: string
      created: boolean
    }

    if (found) {
      webhook = { id: found.id, url: found.url, created: false }
    } else {
      const created = await stripe.webhookEndpoints.create({
        url: endpointUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.paid',
          'invoice.payment_failed',
        ],
        description: 'NexusScope Early Access subscriptions',
      })
      webhook = {
        id: created.id,
        url: created.url,
        secret: created.secret ?? undefined,
        created: true,
      }
    }

    return NextResponse.json({
      ok: true,
      priceId,
      lookupKey: PRICE_LOOKUP_KEY,
      webhook,
      hint: webhook.secret
        ? 'Store webhook.secret as STRIPE_WEBHOOK_SECRET in Vercel env, then redeploy.'
        : 'Webhook already exists — set STRIPE_WEBHOOK_SECRET from the Stripe Dashboard if missing.',
    })
  } catch (err) {
    console.error('[stripe] setup failed', err)
    return NextResponse.json(
      { error: 'setup_failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
