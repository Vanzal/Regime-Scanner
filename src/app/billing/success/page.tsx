import { cookies } from 'next/headers'
import Link from 'next/link'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { getStripe } from '@/lib/stripe'
import { getStore } from '@/lib/store'
import { openBillingPortalForm } from '@/app/actions/stripe'
import { SiteFooter } from '@/components/site/site-footer'

export const dynamic = 'force-dynamic'

async function resolveSession(sessionId: string | undefined) {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === '[SENSITIVE]') {
    return null
  }
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const email =
      session.customer_email ||
      session.customer_details?.email ||
      session.metadata?.email ||
      null
    return { email, status: session.status, paymentStatus: session.payment_status }
  } catch {
    return null
  }
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const s = dict.site.subscribe
  const { session_id: sessionId } = await searchParams
  const session = await resolveSession(sessionId)
  const email = session?.email ?? null
  const sub = email ? await getStore().getSubscriptionByEmail(email) : null

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <header className="border-b-2 border-[var(--ns-fg)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-sm tracking-tight sm:text-base">
            NexusScope
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
          {s.success_eyebrow}
        </p>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">{s.success_title}</h1>
        <p className="font-reading mt-5 max-w-prose text-base leading-relaxed text-[var(--ns-fg-muted)]">
          {s.success_body}
        </p>
        {email && (
          <p className="mt-4 border-l-2 border-[var(--ns-accent)] pl-4 text-sm font-semibold">
            {email}
            {sub?.status ? ` · ${sub.status}` : ''}
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/#waitlist" className="ns-btn-primary">
            {s.back_waitlist}
          </Link>
          {email && (
            <form action={openBillingPortalForm}>
              <input type="hidden" name="email" value={email} />
              <button type="submit" className="border border-[var(--ns-border-strong)] px-4 py-2 text-sm font-semibold hover:bg-[var(--ns-bg-elevated)]">
                {s.manage_billing}
              </button>
            </form>
          )}
        </div>
        <p className="font-reading mt-8 text-xs text-[var(--ns-fg-dim)]">{s.success_note}</p>
      </main>

      <SiteFooter dict={dict} locale={locale} />
    </div>
  )
}
