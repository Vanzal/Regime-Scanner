import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportAssessment } from '@/lib/report/data'
import type { ClockStage } from '@/lib/rules/types'
import { regimeLabel } from './verdict-strip'

/** „24 h / 72 h / 1 Monat“ – menschenlesbare Fristen-Form. */
export function formatStageHours(dict: Dictionary, hours: number): string {
  if (hours >= 672 && hours % 24 === 0 && hours / 24 >= 28 && hours / 24 < 32) {
    return t(dict, 'report.clock.month')
  }
  if (hours >= 24) {
    const days = Math.round(hours / 24)
    return t(dict, 'report.clock.days', { days })
  }
  return t(dict, 'report.clock.hours', { hours })
}

function StageBadge({ stage, dict, last }: { stage: ClockStage; dict: Dictionary; last: boolean }) {
  return (
    <li className="relative flex-1">
      <div className="flex items-center">
        <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {formatStageHours(dict, stage.hours).replace(/ .*/, '')}
        </span>
        {!last && <span className="h-0.5 flex-1 bg-indigo-200" aria-hidden />}
      </div>
      <div className="mt-2 pr-4">
        <p className="text-sm font-semibold text-slate-900">{formatStageHours(dict, stage.hours)}</p>
        <p className="mt-0.5 text-xs leading-snug text-slate-600">{stage.label ?? stage.key}</p>
      </div>
    </li>
  )
}

/** 2 · Die Meldeuhr – das visuelle Zentrum des Berichts. */
export function ClockTimeline({ assessments, dict }: { assessments: ReportAssessment[]; dict: Dictionary }) {
  const relevant = assessments.filter((a) => a.effectiveApplicable !== 'not_applicable')
  if (relevant.length === 0) {
    return <p className="text-sm text-slate-600">{t(dict, 'report.clock.none_applicable')}</p>
  }
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-700">{t(dict, 'report.clock.intro')}</p>
      {relevant.map((a) => {
        const label = regimeLabel(dict, a.regime)
        const deadlines = a.deadlines_json
        return (
          <div
            key={a.regime}
            data-testid={`clock-${a.regime}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                {label.code} · {label.lawShort}
              </h4>
              <a
                href={deadlines.authority.portal_url}
                className="text-xs font-medium text-indigo-600 underline-offset-2 hover:underline"
                rel="noreferrer"
              >
                {deadlines.authority.name}
              </a>
            </div>
            <ol className="flex gap-0">
              {deadlines.stages.map((s, i) => (
                <StageBadge key={s.key} stage={s} dict={dict} last={i === deadlines.stages.length - 1} />
              ))}
            </ol>
            <dl className="mt-4 grid grid-cols-1 gap-1 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="inline font-semibold text-slate-700">{t(dict, 'report.clock.authority')}: </dt>
                <dd className="inline">{deadlines.authority.name}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-700">{t(dict, 'report.clock.channel')}: </dt>
                <dd className="inline">{deadlines.authority.format ?? '—'}</dd>
              </div>
            </dl>
          </div>
        )
      })}
    </div>
  )
}
