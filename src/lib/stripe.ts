import 'server-only'
import Stripe from 'stripe'

/** Latest Stripe API version (see stripe-best-practices skill). */
const API_VERSION = '2026-08-26.dahlia' as const

let client: Stripe | null = null

/** Stripe client — instantiate once; never put keys in source. */
export function getStripe(): Stripe {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === '[SENSITIVE]') {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  client = new Stripe(key, { apiVersion: API_VERSION, typescript: true })
  return client
}

/** Reset between tests. */
export function resetStripeClient(): void {
  client = null
}

export const PRICE_LOOKUP_KEY =
  process.env.STRIPE_PRICE_LOOKUP_KEY?.trim() || 'nexusscope_early_access_monthly'

export const PRODUCT_NAME =
  process.env.STRIPE_PRODUCT_NAME?.trim() || 'NexusScope Early Access'

/**
 * Resolve the recurring Price for Early Access.
 * Prefers STRIPE_PRICE_ID; otherwise finds/creates by lookup_key.
 * Amount only used when creating — set STRIPE_UNIT_AMOUNT_CENTS in env.
 */
export async function ensureSubscriptionPrice(): Promise<string> {
  const configured = process.env.STRIPE_PRICE_ID?.trim()
  if (configured) return configured

  const stripe = getStripe()
  const existing = await stripe.prices.list({
    lookup_keys: [PRICE_LOOKUP_KEY],
    active: true,
    limit: 1,
  })
  if (existing.data[0]?.id) return existing.data[0].id

  const amountRaw = process.env.STRIPE_UNIT_AMOUNT_CENTS?.trim()
  if (!amountRaw) {
    throw new Error(
      'Neither STRIPE_PRICE_ID nor STRIPE_UNIT_AMOUNT_CENTS is set — create a Price in Stripe or set one of these env vars',
    )
  }
  const unitAmount = Number(amountRaw)
  if (!Number.isInteger(unitAmount) || unitAmount < 1) {
    throw new Error('STRIPE_UNIT_AMOUNT_CENTS must be a positive integer (cents)')
  }

  const currency = (process.env.STRIPE_CURRENCY?.trim() || 'eur').toLowerCase()
  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    metadata: { app: 'nexusscope', plan: 'early_access' },
  })
  const price = await stripe.prices.create({
    product: product.id,
    currency,
    unit_amount: unitAmount,
    recurring: { interval: 'month' },
    lookup_key: PRICE_LOOKUP_KEY,
    metadata: { app: 'nexusscope', plan: 'early_access' },
  })
  return price.id
}

export function siteUrl(): string {
  const raw =
    process.env.SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return raw.replace(/\/$/, '')
}

/** Checkout session tag for Dashboard comparison (API ≥ 2026-03-25.dahlia). */
export function checkoutIntegrationId(): string {
  const suffix = Array.from({ length: 8 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
  return `nexusscope-sub-${suffix}`
}
