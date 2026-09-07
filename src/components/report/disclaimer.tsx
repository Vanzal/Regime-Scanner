import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportData } from '@/lib/report/data'

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('de-DE')}, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
}

/** 5 · Grenzen & Hinweise – Rechtsstand, Scan-Zeitpunkt, Quellen. */
export function Disclaimer({ data, dict }: { data: ReportData; dict: Dictionary }) {
  const versions = [...new Map(data.assessments.map((a) => [a.rules_version, a])).entries()]
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
      <p className="leading-relaxed">{dict.report.limits.body}</p>
      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-900">{t(dict, 'report.limits.scan_time')}</dt>
          <dd>{fmtDateTime(data.scan.finished_at ?? data.scan.created_at)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">{t(dict, 'report.limits.mode_fixture').split(' (')[0]}</dt>
          <dd>
            {data.scan.mode === 'fixture'
              ? t(dict, 'report.limits.mode_fixture')
              : t(dict, 'report.limits.mode_live')}
          </dd>
        </div>
      </dl>
      {versions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-900">{t(dict, 'report.limits.rules_version')}</h4>
          <ul className="mt-1 space-y-1 text-xs">
            {versions.map(([version, a]) => {
              const sources = data.rulesSources[a.regime] ?? []
              return (
                <li key={version}>
                  <span className="font-mono">{version}</span> · {t(dict, 'report.limits.effective_from')}{' '}
                  {a.effective_from ?? '—'}
                  {sources.length > 0 && (
                    <>
                      {' · '}
                      <span className="text-slate-500">
                        {t(dict, 'report.limits.source_of_law')}:{' '}
                        {sources.map((s, i) => (
                          <span key={s}>
                            {i > 0 && ', '}
                            <a href={s} className="text-indigo-600 underline-offset-2 hover:underline" rel="noreferrer">
                              [{i + 1}]
                            </a>
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
