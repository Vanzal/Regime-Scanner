/**
 * Product-surface flags.
 *
 * Waitlist is the primary conversion path until PRODUCT_READY is flipped.
 * Scan collection stays fixture-first unless SCAN_MODE=live (GET-only, robots.txt).
 */

function envTrue(value: string | undefined): boolean {
  if (!value) return false
  return value === 'true' || value === '1' || value === 'yes'
}

/** Marketing CTA: Start free scan + email-gated intake. Default off. */
export function isProductReady(): boolean {
  return envTrue(process.env.NEXT_PUBLIC_PRODUCT_READY)
}

/** Stripe Checkout on /pricing. Default off — page still looks real. */
export function isPricingLive(): boolean {
  return envTrue(process.env.NEXT_PUBLIC_PRICING_LIVE)
}

/** Live GET-only public-footprint collection. Default fixture (no network). */
export function isLiveScanEnabled(): boolean {
  return process.env.SCAN_MODE === 'live'
}

export function scanModeLabel(): 'fixture' | 'live' {
  return isLiveScanEnabled() ? 'live' : 'fixture'
}
