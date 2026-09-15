import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ScopeCheckResult, ScopeStatus } from '@/lib/scope-check/schema'

/** Gleiche Farbsprache wie der deterministische Verdict-Strip. */
const STATUS_STYLE: Record<ScopeStatus, string> = {
  likely: 'ns-status-in',
  possible: 'ns-status-unclear',
  unlikely: 'ns-status-out',
}

/**
 * KI-generierte Richtungsabschätzung (LLM-Scope-Check). Ergänzt die
 * regelbasierte Prüfung; niemals Ersatz für deren Herleitung (Abschnitt 1).
 */
export function ScopeCheckBlock({ result, dict }: { result: ScopeCheckResult; dict: Dictionary }) {
  return (
    <div data-testid="scope-check-block" className="space-y-6">
      <p className="rounded-[var(--ns-radius)] border border-[var(--ns-border)] bg-[var(--ns-bg-panel)] px-4 py-3 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
        {t(dict, 'report.scope.ai_note')}
      </p>

      <p className="text-sm leading-relaxed text-[var(--ns-fg)]">{result.summary}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {result.regimes.map((r) => (
          <div key={r.name} data-testid={`scope-card-${r.name.toLowerCase()}`} className="ns-card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--ns-fg)]">{r.name}</span>
              <span
                className={`shrink-0 rounded-md border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${STATUS_STYLE[r.status]}`}
              >
                {t(dict, `report.scope.status.${r.status}`)}
              </span>
            </div>
            <p className="text-sm leading-snug text-[var(--ns-fg-muted)]">{r.reasoning}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ns-fg-dim)]">
            {t(dict, 'report.scope.gaps')}
          </h4>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-snug text-[var(--ns-fg)]">
            {result.key_gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ns-fg-dim)]">
            {t(dict, 'report.scope.next_steps')}
          </h4>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-snug text-[var(--ns-fg)]">
            {result.next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </div>

      <p className="text-xs italic text-[var(--ns-fg-dim)]">
        {t(dict, 'report.scope.disclaimer_label')}: {result.disclaimer}
      </p>
    </div>
  )
}
