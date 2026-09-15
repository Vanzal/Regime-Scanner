import { NextResponse } from 'next/server'
import { STRIPE_WEBHOOK_EVENTS } from '@/lib/billing/webhook'
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
      eventsUpdated?: boolean
    }

    if (found) {
      const have = new Set(found.enabled_events)
      const missing = STRIPE_WEBHOOK_EVENTS.filter((event) => !have.has(event))
      if (missing.length > 0) {
        await stripe.webhookEndpoints.update(found.id, {
          enabled_events: [...STRIPE_WEBHOOK_EVENTS],
        })
      }
      webhook = {
        id: found.id,
        url: found.url,
        created: false,
        eventsUpdated: missing.length > 0,
      }
    } else {
      const created = await stripe.webhookEndpoints.create({
        url: endpointUrl,
        enabled_events: [...STRIPE_WEBHOOK_EVENTS],
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
        : webhook.eventsUpdated
          ? 'Existing webhook events were updated. STRIPE_WEBHOOK_SECRET is unchanged.'
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
