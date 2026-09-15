import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import { renderInlineMd } from './md'
import type { ReportAssessment } from '@/lib/report/data'
import type { Applicable } from '@/lib/rules/types'

const BADGE_STYLE: Record<Applicable, string> = {
  applicable: 'ns-status-in',
  not_applicable: 'ns-status-out',
  unclear: 'ns-status-unclear',
}

export function regimeLabel(dict: Dictionary, regime: string): { code: string; name: string; lawShort: string } {
  const block = (dict.regimes as Record<string, { code: string; name: string; law_short: string }>)[regime]
  return {
    code: block?.code ?? regime.toUpperCase(),
    name: block?.name ?? regime,
    lawShort: block?.law_short ?? '',
  }
}

/** 1 · Drei unabhängige Urteilskarten (DE/AT/CH) – nie zusammengefasst. */
export function VerdictStrip({ assessments, dict }: { assessments: ReportAssessment[]; dict: Dictionary }) {
  const order = ['de', 'at', 'ch']
  const sorted = [...assessments].sort(
    (a, b) => order.indexOf(a.regime) - order.indexOf(b.regime),
  )
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {sorted.map((a) => {
        const label = regimeLabel(dict, a.regime)
        const overridden = a.override_applicable !== null && a.override_applicable !== undefined
        return (
          <div
            key={a.regime}
            data-testid={`verdict-card-${a.regime}`}
            className="ns-card flex flex-col gap-3 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--ns-fg)]">{label.code}</span>
              <span
                data-testid={`verdict-badge-${a.regime}`}
                className={`rounded-md border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${BADGE_STYLE[a.effectiveApplicable]}`}
              >
                {t(dict, `report.verdict.${a.effectiveApplicable}`)}
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--ns-fg-dim)]">
              {label.name} · {label.lawShort}
            </p>
            <p className="text-sm leading-snug text-[var(--ns-fg)]">{renderInlineMd(a.effectiveReasoning.split('\n')[0])}</p>
            <div className="mt-auto flex items-center justify-between pt-2 text-xs text-[var(--ns-fg-dim)]">
              <span>
                {t(dict, 'report.verdict.confidence')}: {Math.round(a.confidence * 100)} %
              </span>
              {overridden && (
                <span
                  className="rounded-full border border-[var(--ns-accent)] px-2 py-0.5 font-medium text-[var(--ns-accent)]"
                  title={t(dict, 'report.verdict.override_note')}
                >
                  {t(dict, 'report.verdict.manually_reviewed')}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
