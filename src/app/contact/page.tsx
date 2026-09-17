import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { SiteShell } from '@/components/site/site-shell'
import { ContactForm } from '@/components/site/contact-form'
import { publicPageMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = publicPageMeta('/contact', {
  title: 'Contact',
  description: 'Contact NexusScope about waitlist access, data residency, or a future scan for your DACH organisation.',
})

export default async function ContactPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const c = dict.site.contact_page
  const f = dict.site.footer

  return (
    <SiteShell dict={dict} locale={locale}>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{c.title}</h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--ns-fg-muted)]">{c.subtitle}</p>
          <dl className="mt-8 space-y-3 text-sm text-[var(--ns-fg-muted)]">
            <div>
              <dt className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
                {f.email_label}
              </dt>
              <dd>
                <a className="underline underline-offset-4" href={`mailto:${f.contact_email}`}>
                  {f.contact_email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
                {f.phone_label}
              </dt>
              <dd>{f.phone}</dd>
            </div>
            <div>
              <dt className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
                {dict.site.legal.operator}
              </dt>
              <dd className="mt-1">
                {f.address_lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          <p className="mt-8 text-sm text-[var(--ns-fg-dim)]">{f.data_location}</p>
        </div>
        <ContactForm dict={dict} />
      </div>
    </SiteShell>
  )
}
