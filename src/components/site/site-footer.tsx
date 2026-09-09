import { LangSwitch } from './lang-switch'
import type { Dictionary, Locale } from '@/i18n'

export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.site.footer
  return (
    <footer className="border-t-2 border-[var(--ns-fg)] bg-[var(--ns-bg)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg tracking-tight text-[var(--ns-fg)]">NexusScope</p>
            <p className="font-reading mt-3 max-w-xs text-sm leading-relaxed text-[var(--ns-fg-muted)]">{f.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm" aria-label="Legal">
            <a href="/impressum" className="text-[var(--ns-fg-muted)] transition hover:text-[var(--ns-fg)]">
              {f.impressum}
            </a>
            <a href="/datenschutz" className="text-[var(--ns-fg-muted)] transition hover:text-[var(--ns-fg)]">
              {f.datenschutz}
            </a>
            <p className="mt-3 text-[var(--ns-fg-dim)]">
              {f.contact_label}{' '}
              <a
                href={`mailto:${f.contact_email}`}
                className="text-[var(--ns-fg-muted)] transition hover:text-[var(--ns-fg)]"
              >
                {f.contact_email}
              </a>
            </p>
          </nav>

          <div>
            <p className="mb-2 font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
              {f.lang_label}
            </p>
            <LangSwitch locale={locale} label={f.lang_label} variant="light" />
          </div>
        </div>

        <p className="mt-12 border-t border-[var(--ns-border)] pt-6 font-reading text-xs text-[var(--ns-fg-dim)]">
          {f.legal_note}
        </p>
      </div>
    </footer>
  )
}
