import { LangSwitch } from './lang-switch'
import { CookieSettingsLink } from './cookie-settings-link'
import type { Dictionary, Locale } from '@/i18n'

const linkClass =
  'text-[var(--ns-fg-muted)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg)] hover:decoration-[var(--ns-fg-muted)]'

const quietLinkClass =
  'text-[var(--ns-fg-dim)] underline decoration-[var(--ns-border)] underline-offset-4 transition hover:text-[var(--ns-fg-muted)]'

/**
 * Site-wide footer with Swiss / EU / DACH imprint essentials.
 *
 * PLACEHOLDERS (replace before go-live):
 * - Exact company legal name & form → footer.legal_form / impressum page
 * - Full Swiss postal address → footer.address_lines
 * - Email / phone → footer.contact_email / footer.phone
 * - UID / VAT (MwSt) number → footer.uid
 * - Final TOS copy → /terms + legal.tos_placeholder
 */
export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.site.footer

  return (
    <footer
      className="border-t border-[var(--ns-border)] bg-[var(--ns-bg)]"
      data-testid="site-footer"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {/* ── Left: company identity & contact (Impressum essentials) ── */}
          <section aria-labelledby="footer-company-heading">
            <h2 id="footer-company-heading" className="font-display text-lg tracking-tight text-[var(--ns-fg)]">
              {f.company_name}
            </h2>
            {/* Exact legal name & form — replace placeholder before go-live */}
            <p className="mt-1 text-sm text-[var(--ns-fg-muted)]">{f.legal_form}</p>

            <address className="font-reading mt-4 not-italic text-sm leading-relaxed text-[var(--ns-fg-muted)]">
              {/* Full Swiss postal address — replace placeholders before go-live */}
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
              {/* Optional phone — replace placeholder or remove before go-live */}
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-[var(--ns-fg-dim)]">{f.phone_label}:</dt>
                <dd>
                  <a href={`tel:${f.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                    {f.phone}
                  </a>
                </dd>
              </div>
              {/* UID / VAT (CHE-…) — replace placeholder if applicable */}
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-[var(--ns-fg-dim)]">{f.uid_label}:</dt>
                <dd>{f.uid}</dd>
              </div>
            </dl>

            <p className="mt-5 font-reading text-xs leading-relaxed text-[var(--ns-fg-dim)]">{f.copyright}</p>
          </section>

          {/* ── Middle: legal links ── */}
          <nav aria-labelledby="footer-legal-heading">
            <h2
              id="footer-legal-heading"
              className="mb-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]"
            >
              {f.legal_heading}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="/impressum" className={linkClass}>
                  {f.impressum}
                </a>
              </li>
              <li>
                <a href="/datenschutz" className={linkClass}>
                  {f.datenschutz}
                </a>
              </li>
              <li>
                {/* Final TOS text will be provided later — route is ready */}
                <a href="/terms" className={linkClass}>
                  {f.terms}
                </a>
              </li>
              <li>
                <a href="/cookies" className={linkClass}>
                  {f.cookies}
                </a>
              </li>
              <li>
                <CookieSettingsLink label={f.cookie_settings} className={linkClass} />
              </li>
            </ul>
          </nav>

          {/* ── Right: language + disclaimer ── */}
          <section aria-labelledby="footer-lang-heading" className="sm:col-span-2 lg:col-span-1">
            <h2
              id="footer-lang-heading"
              className="mb-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]"
            >
              {f.lang_label}
            </h2>
            <LangSwitch locale={locale} label={f.lang_label} variant="light" />
            <p className="font-reading mt-6 max-w-sm text-sm leading-relaxed text-[var(--ns-fg-muted)]">
              {f.disclaimer}
            </p>
          </section>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--ns-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-reading text-xs text-[var(--ns-fg-dim)]">{f.data_location}</p>
          <CookieSettingsLink label={f.cookie_settings} className={`text-xs ${quietLinkClass}`} />
        </div>
      </div>
    </footer>
  )
}
