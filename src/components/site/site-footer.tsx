import Link from 'next/link'
import { LangSwitch } from './lang-switch'
import { CookieSettingsLink } from './cookie-settings-link'
import { BrandMark } from './brand-mark'
import { footerLegalLinks, type LegalDocId } from '@/lib/legal/catalog'
import type { Dictionary, Locale } from '@/i18n'

const linkClass =
  'text-[var(--ns-fg-muted)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg)] hover:decoration-[var(--ns-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]'

const quietLinkClass =
  'text-[var(--ns-fg-dim)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]'

const headingCls =
  'mb-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]'

/**
 * Site-wide footer with Swiss / EU / DACH imprint essentials.
 *
 * PLACEHOLDERS (replace before go-live):
 * - Exact company legal name & form → footer.legal_form / impressum page
 * - Full Swiss postal address → footer.address_lines
 * - Email / phone → footer.contact_email / footer.phone
 * - UID / VAT (MwSt) number → footer.uid
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
        <h2 id={headingId} className={headingCls}>
          {f.legal_heading}
        </h2>
      ) : null}
      <ul className="flex flex-col gap-2.5 text-sm">
        {legalLinks.map((item) => (
          <li key={item.id}>
            <Link href={item.href} data-testid={`footer-legal-${item.id}`} className={linkClass}>
              {labels[item.id]}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/impressum" className={linkClass}>
            {f.impressum}
          </Link>
        </li>
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

  return (
    <footer
      className="border-t border-[var(--ns-border)] bg-[var(--ns-bg-panel)]"
      data-testid="site-footer"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <section aria-labelledby="footer-company-heading" className="min-w-0 sm:col-span-2 lg:col-span-1">
            <h2 id="footer-company-heading" className="sr-only">
              {f.company_name}
            </h2>
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--ns-fg-muted)]">{f.tagline}</p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--ns-fg-dim)]">{f.disclaimer}</p>
          </section>

          <section aria-labelledby="footer-product-heading">
            <h2 id="footer-product-heading" className={headingCls}>
              {f.product}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/#how" className={linkClass}>
                  {f.how}
                </Link>
              </li>
              <li>
                <Link href="/#preview" className={linkClass}>
                  {f.example_report}
                </Link>
              </li>
              <li>
                <Link href="/#waitlist" className={linkClass}>
                  {f.early_access}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  {f.pricing}
                </Link>
              </li>
            </ul>
          </section>

          <FooterLegalNav dict={dict} locale={locale} headingId="footer-legal-heading" />

          <section aria-labelledby="footer-contact-heading">
            <h2 id="footer-contact-heading" className={headingCls}>
              {f.contact_heading}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-[var(--ns-fg-muted)]">
              <li>
                <Link href="/contact" className={linkClass}>
                  {f.contact}
                </Link>
              </li>
              <li>
                <a href={`mailto:${f.contact_email}`} className={linkClass}>
                  {f.contact_email}
                </a>
              </li>
              <li className="pt-2">
                <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
                  {f.lang_label}
                </p>
                <div className="mt-2">
                  <LangSwitch locale={locale} label={f.lang_label} />
                </div>
              </li>
            </ul>
            <address className="mt-5 not-italic text-xs leading-relaxed text-[var(--ns-fg-dim)]">
              <span className="block">{f.legal_form}</span>
              {f.address_lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="mt-1 block">
                {f.uid_label}: {f.uid}
              </span>
              <span className="block">
                {f.phone_label}: {f.phone}
              </span>
            </address>
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
