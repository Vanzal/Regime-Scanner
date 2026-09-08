import { LangSwitch } from './lang-switch'
import type { Dictionary, Locale } from '@/i18n'

export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const f = dict.site.footer
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-100">
              Nexus<span className="text-cyan-400">Scope</span>
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">{f.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2 text-xs" aria-label="Legal">
            <a href="/impressum" className="text-slate-400 transition hover:text-cyan-300">{f.impressum}</a>
            <a href="/datenschutz" className="text-slate-400 transition hover:text-cyan-300">{f.datenschutz}</a>
            <p className="mt-2 text-slate-500">
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

        <p className="mt-10 border-t border-slate-800/70 pt-6 text-xs text-slate-600">{f.legal_note}</p>
      </div>
    </footer>
  )
}
