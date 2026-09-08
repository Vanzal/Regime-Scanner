import { LangSwitch } from './lang-switch'
import type { Dictionary, Locale } from '@/i18n'

export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.site.footer
  return (
    <footer className="border-t border-[var(--ns-border)] bg-[#050810]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-slate-100">
              Nexus<span className="text-cyan-400">Scope</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">{f.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm" aria-label="Legal">
            <a href="/impressum" className="text-slate-400 transition hover:text-cyan-300">{f.impressum}</a>
            <a href="/datenschutz" className="text-slate-400 transition hover:text-cyan-300">{f.datenschutz}</a>
            <p className="mt-3 text-slate-500">
              {f.contact_label}{' '}
              <a href={`mailto:${f.contact_email}`} className="text-slate-400 transition hover:text-cyan-300">
                {f.contact_email}
              </a>
            </p>
          </nav>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-600">{f.lang_label}</p>
            <LangSwitch locale={locale} label={f.lang_label} />
          </div>
        </div>

        <p className="mt-12 border-t border-[var(--ns-border)] pt-6 text-xs text-slate-600">{f.legal_note}</p>
      </div>
    </footer>
  )
}
