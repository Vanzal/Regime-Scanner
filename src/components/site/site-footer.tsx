import Link from 'next/link'
import { LangSwitch } from './lang-switch'
import { CookieSettingsLink } from './cookie-settings-link'
import { BrandMark } from './brand-mark'
import { footerLegalLinks, type LegalDocId } from '@/lib/legal/catalog'
import type { Dictionary, Locale } from '@/i18n'

const linkClass =
  'text-[var(--ns-fg-muted)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg)] hover:decoration-[var(--ns-fg-muted)]'

const quietLinkClass =
  'text-[var(--ns-fg-dim)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg-muted)]'

/**
 * Site-wide footer with Swiss / EU / DACH imprint essentials.
 * Omit phone / UID when empty — do not invent registration details.
 */
export function FooterLegalNav({
  dict,
  locale,
  headingId,
}: {
  dict: Dictionary
  locale: Locale
  headingId?: string
}) {
  const f = dict.site.footer
  const labels: Record<LegalDocId, string> = {
    privacy: f.datenschutz,
    terms: f.terms,
    dpa: f.dpa,
  }
  const legalLinks = footerLegalLinks(locale)

  return (
    <nav aria-labelledby={headingId} aria-label={headingId ? undefined : dict.site.legal.docs_nav}>
      {headingId ? (
        <h2
          id={headingId}
          className="mb-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]"
        >
          {f.legal_heading}
        </h2>
      ) : null}
      <ul className="flex flex-col gap-2.5 text-sm">
        <li>
          <Link href="/impressum" className={linkClass}>
            {f.impressum}
          </Link>
        </li>
        {legalLinks.map((item) => (
          <li key={item.id}>
            <Link href={item.href} data-testid={`footer-legal-${item.id}`} className={linkClass}>
              {labels[item.id]}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/cookies" className={linkClass}>
            {f.cookies}
          </Link>
        </li>
        <li>
          <CookieSettingsLink label={f.cookie_settings} className={linkClass} />
        </li>
      </ul>
    </nav>
  )
}

export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.site.footer
  const phone = f.phone?.trim()
  const uid = f.uid?.trim()

  return (
    <footer
      className="border-t border-[var(--ns-border)] bg-[var(--ns-bg)]"
      data-testid="site-footer"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <section aria-labelledby="footer-company-heading">
            <h2 id="footer-company-heading" className="sr-only">
              {f.company_name}
            </h2>
            <BrandMark />
            <p className="mt-3 text-sm text-[var(--ns-fg-muted)]">{f.tagline}</p>
            <p className="mt-2 text-sm text-[var(--ns-fg-muted)]">
              {f.operator_name}
              <span className="text-[var(--ns-fg-dim)]"> · </span>
              {f.legal_form}
            </p>
            <address className="mt-4 not-italic text-sm leading-relaxed text-[var(--ns-fg-muted)]">
              {f.address_lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <dl className="mt-4 space-y-1.5 text-sm text-[var(--ns-fg-muted)]">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-[var(--ns-fg-dim)]">{f.email_label}:</dt>
                <dd>
                  <a href={`mailto:${f.contact_email}`} className={linkClass}>
                    {f.contact_email}
                  </a>
                </dd>
              </div>
              {phone ? (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-[var(--ns-fg-dim)]">{f.phone_label}:</dt>
                  <dd>
                    <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                      {phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {uid ? (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-[var(--ns-fg-dim)]">{f.uid_label}:</dt>
                  <dd>{uid}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
              {f.product}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/#features" className={linkClass}>
                  {dict.site.nav.features}
                </Link>
              </li>
              <li>
                <Link href="/#preview" className={linkClass}>
                  {dict.site.nav.preview}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  {f.pricing}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  {f.contact}
                </Link>
              </li>
            </ul>
          </section>

          <FooterLegalNav dict={dict} locale={locale} headingId="footer-legal-heading" />

          <section aria-labelledby="footer-lang-heading">
            <h2
              id="footer-lang-heading"
              className="mb-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]"
            >
              {f.lang_label}
            </h2>
            <LangSwitch locale={locale} label={f.lang_label} />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--ns-fg-muted)]">{f.disclaimer}</p>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--ns-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--ns-fg-dim)]">
            {f.copyright} {f.data_location}
          </p>
          <CookieSettingsLink label={f.cookie_settings} className={`text-xs ${quietLinkClass}`} />
        </div>
      </div>
    </footer>
  )
}
