import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportAssessment } from '@/lib/report/data'
import { regimeLabel } from './verdict-strip'

/** 4 · Auditierebare Herleitung – pro Regime einklappbar. */
export function ThresholdTraceBlock({ assessments, dict }: { assessments: ReportAssessment[]; dict: Dictionary }) {
  return (
    <div className="space-y-3">
      {assessments.map((a) => {
        const label = regimeLabel(dict, a.regime)
        const trace = a.threshold_trace_json
        return (
          <details
            key={a.regime}
            data-testid={`trace-${a.regime}`}
            className="group rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-5">
              <span className="text-sm font-semibold text-slate-900">
                {label.code} · {label.lawShort}
              </span>
              <span className="text-xs font-medium text-indigo-600 group-open:hidden">
                {t(dict, 'report.trace.open')} ↓
              </span>
            </summary>
            <div className="border-t border-slate-100 p-5 pt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-2 pr-2 font-medium">{t(dict, 'report.trace.column_check')}</th>
                    <th className="pb-2 pr-2 font-medium">{t(dict, 'report.trace.column_result')}</th>
                    <th className="pb-2 font-medium">{t(dict, 'report.trace.column_detail')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trace.entries.map((e, i) => (
                    <tr key={i}>
                      <td className="py-1.5 pr-2 text-slate-800">{e.label}</td>
                      <td className="py-1.5 pr-2">
                        <span
                          className={
                            e.status === 'pass' || e.status === 'fired'
                              ? 'font-semibold text-emerald-700'
                              : e.status === 'fail' || e.status === 'skipped'
                                ? 'text-slate-500'
                                : 'font-semibold text-amber-700'
                          }
                        >
                          {t(dict, `report.trace.status.${e.status}`)}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-500">{e.detail ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {trace.missing_inputs.length > 0 && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <span className="font-semibold">{t(dict, 'report.trace.missing')}</span>{' '}
                  {trace.missing_inputs.join(', ')}
                </p>
              )}
              <p className="mt-3 text-[11px] text-slate-400">
                {t(dict, 'report.limits.rules_version')}: {a.rules_version}
              </p>
            </div>
          </details>
        )
      })}
    </div>
  )
}
