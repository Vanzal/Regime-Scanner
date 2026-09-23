import { NextResponse, type NextRequest } from 'next/server'
import { SITE_GATE_COOKIE, decideSiteGate } from '@/lib/site-gate'
import { wwwToApexRedirectUrl } from '@/lib/site-url'

/**
 * Prefer the non-www apex as canonical. www.nexusscopes.com → https://nexusscopes.com
 * (308 permanent; Next.js middleware preserves the request method, unlike 301).
 * Vercel still needs www as a project domain for this to run; see README.
 *
 * When SITE_PASSWORD is set, unauthenticated visitors are sent to /enter.
 * Stripe webhooks keep their own signature check and stay reachable.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const target = wwwToApexRedirectUrl(host, request.nextUrl.pathname, request.nextUrl.search)
  if (target) {
    return NextResponse.redirect(target, 308)
  }

  const decision = await decideSiteGate({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    cookie: request.cookies.get(SITE_GATE_COOKIE)?.value,
  })
  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.location, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
