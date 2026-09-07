import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportAssessment } from '@/lib/report/data'
import type { Applicable } from '@/lib/rules/types'

const BADGE_STYLE: Record<Applicable, string> = {
  applicable: 'bg-emerald-100 text-emerald-900 ring-emerald-600/30',
  not_applicable: 'bg-slate-100 text-slate-700 ring-slate-500/30',
  unclear: 'bg-amber-100 text-amber-900 ring-amber-600/30',
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
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{label.code}</span>
              <span
                data-testid={`verdict-badge-${a.regime}`}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ${BADGE_STYLE[a.effectiveApplicable]}`}
              >
                {t(dict, `report.verdict.${a.effectiveApplicable}`)}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {label.name} · {label.lawShort}
            </p>
            <p className="text-sm leading-snug text-slate-800">{a.effectiveReasoning.split('\n')[0]}</p>
            <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                {t(dict, 'report.verdict.confidence')}: {Math.round(a.confidence * 100)} %
              </span>
              {overridden && (
                <span
                  className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 ring-1 ring-indigo-600/20"
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
