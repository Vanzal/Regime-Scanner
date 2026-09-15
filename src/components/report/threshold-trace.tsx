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
            className="group ns-card overflow-hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-5">
              <span className="text-sm font-semibold text-[var(--ns-fg)]">
                {label.code} · {label.lawShort}
              </span>
              <span className="text-xs font-medium text-[var(--ns-accent)] group-open:hidden">
                {t(dict, 'report.trace.open')} ↓
              </span>
            </summary>
            <div className="border-t border-[var(--ns-border)] p-5 pt-4">
              {trace.summary && (
                <p
                  className="mb-3 font-mono text-[11px] text-[var(--ns-fg-dim)]"
                  data-testid={`trace-summary-${a.regime}`}
                >
                  <span className="font-sans font-semibold text-[var(--ns-fg-muted)]">
                    {t(dict, 'report.trace.summary')}:
                  </span>{' '}
                  {trace.summary}
                </p>
              )}
              {(trace.unclear_code || trace.matched_class_id) && (
                <div className="mb-3 space-y-1 text-[11px] text-[var(--ns-fg-muted)]">
                  <p>
                    {trace.unclear_code && (
                      <>
                        <span className="font-semibold">{t(dict, 'report.trace.unclear_code')}:</span>{' '}
                        <span className="font-mono text-[var(--ns-warning)]">{trace.unclear_code}</span>
                      </>
                    )}
                    {trace.unclear_code && trace.matched_class_id ? ' · ' : null}
                    {trace.matched_class_id && (
                      <>
                        <span className="font-semibold">{t(dict, 'report.trace.matched_class')}:</span>{' '}
                        <span className="font-mono">{trace.matched_class_id}</span>
                      </>
                    )}
                  </p>
                  {trace.unclear_code &&
                  dict.report.unclear_hints?.[
                    trace.unclear_code as keyof typeof dict.report.unclear_hints
                  ] ? (
                    <p className="rounded-[var(--ns-radius)] border border-[color-mix(in_oklch,var(--ns-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--ns-warning)_10%,transparent)] px-3 py-2 text-[var(--ns-warning)]">
                      <span className="font-semibold">{t(dict, 'report.next_action_label')}:</span>{' '}
                      {
                        dict.report.unclear_hints[
                          trace.unclear_code as keyof typeof dict.report.unclear_hints
                        ]
                      }
                    </p>
                  ) : null}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-xs">
                  <thead>
                    <tr className="text-[var(--ns-fg-dim)]">
                      <th className="pb-2 pr-2 font-medium">{t(dict, 'report.trace.column_check')}</th>
                      <th className="pb-2 pr-2 font-medium">{t(dict, 'report.trace.column_result')}</th>
                      <th className="pb-2 font-medium">{t(dict, 'report.trace.column_detail')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ns-border)]">
                    {trace.entries.map((e, i) => (
                      <tr key={i}>
                        <td className="py-1.5 pr-2 text-[var(--ns-fg)]">
                          {e.label}
                          {e.code ? (
                            <span className="mt-0.5 block font-mono text-[10px] text-[var(--ns-fg-dim)]">
                              {e.code}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1.5 pr-2">
                          <span
                            className={
                              e.status === 'pass' || e.status === 'fired'
                                ? 'font-semibold text-[var(--ns-success)]'
                                : e.status === 'fail' || e.status === 'skipped'
                                  ? 'text-[var(--ns-fg-dim)]'
                                  : 'font-semibold text-[var(--ns-warning)]'
                            }
                          >
                            {t(dict, `report.trace.status.${e.status}`)}
                          </span>
                        </td>
                        <td className="py-1.5 text-[var(--ns-fg-muted)]">{e.detail ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {trace.missing_inputs.length > 0 && (
                <p className="mt-3 rounded-[var(--ns-radius)] border border-[color-mix(in_oklch,var(--ns-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--ns-warning)_10%,transparent)] px-3 py-2 text-xs text-[var(--ns-warning)]">
                  <span className="font-semibold">{t(dict, 'report.trace.missing')}</span>{' '}
                  {trace.missing_inputs.join(', ')}
                </p>
              )}
              <p className="mt-3 text-[11px] text-[var(--ns-fg-dim)]">
                {t(dict, 'report.limits.rules_version')}: {a.rules_version}
              </p>
            </div>
          </details>
        )
      })}
    </div>
  )
}
