import { NextResponse, type NextRequest } from 'next/server'
import { wwwToApexRedirectUrl } from '@/lib/site-url'

/**
 * Prefer the non-www apex as canonical. www.nexusscopes.com → https://nexusscopes.com
 * (308 permanent; Next.js middleware preserves the request method, unlike 301).
 * Vercel still needs www as a project domain for this to run; see README.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const target = wwwToApexRedirectUrl(host, request.nextUrl.pathname, request.nextUrl.search)
  if (target) {
    return NextResponse.redirect(target, 308)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
