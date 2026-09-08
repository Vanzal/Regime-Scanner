import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ScopeCheckResult, ScopeStatus } from '@/lib/scope-check/schema'

/** Gleiche Farbsprache wie der deterministische Verdict-Strip. */
const STATUS_STYLE: Record<ScopeStatus, string> = {
  likely: 'bg-emerald-100 text-emerald-900 ring-emerald-600/30',
  possible: 'bg-amber-100 text-amber-900 ring-amber-600/30',
  unlikely: 'bg-slate-100 text-slate-700 ring-slate-500/30',
}

/**
 * KI-generierte Richtungsabschätzung (LLM-Scope-Check). Ergänzt die
 * regelbasierte Prüfung; niemals Ersatz für deren Herleitung (Abschnitt 1).
 */
export function ScopeCheckBlock({ result, dict }: { result: ScopeCheckResult; dict: Dictionary }) {
  return (
    <div data-testid="scope-check-block" className="space-y-6">
      <p className="rounded-lg bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-900 ring-1 ring-indigo-600/20">
        {t(dict, 'report.scope.ai_note')}
      </p>

      <p className="text-sm leading-relaxed text-slate-800">{result.summary}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {result.regimes.map((r) => (
          <div
            key={r.name}
            data-testid={`scope-card-${r.name.toLowerCase()}`}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{r.name}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ${STATUS_STYLE[r.status]}`}
              >
                {t(dict, `report.scope.status.${r.status}`)}
              </span>
            </div>
            <p className="text-sm leading-snug text-slate-800">{r.reasoning}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            {t(dict, 'report.scope.gaps')}
          </h4>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-snug text-slate-800">
            {result.key_gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            {t(dict, 'report.scope.next_steps')}
          </h4>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-snug text-slate-800">
            {result.next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </div>

      <p className="text-xs italic text-slate-500">
        {t(dict, 'report.scope.disclaimer_label')}: {result.disclaimer}
      </p>
    </div>
  )
}
