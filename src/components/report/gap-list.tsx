import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportFinding } from '@/lib/report/data'

const SEVERITY_STYLE: Record<string, string> = {
  high: 'bg-rose-100 text-rose-900 ring-rose-600/30',
  med: 'bg-amber-100 text-amber-900 ring-amber-600/30',
  low: 'bg-sky-100 text-sky-900 ring-sky-600/30',
  info: 'bg-slate-100 text-slate-700 ring-slate-500/30',
}

/** 3 · Lückenliste nach Schwere – Befund / Warum das Gesetz / Empfehlung. */
export function GapList({ findings, dict }: { findings: ReportFinding[]; dict: Dictionary }) {
  if (findings.length === 0) {
    return <p className="text-sm text-slate-600">{t(dict, 'report.gaps.empty')}</p>
  }
  return (
    <ol className="space-y-3">
      {findings.map((f, idx) => (
        <li
          key={f.id}
          data-testid="gap-item"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.info}`}
            >
              {t(dict, `report.gaps.severity.${f.severity}`)}
            </span>
            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-200">
              {t(dict, 'report.gaps.check')}: {f.check_id}
            </span>
            <h4 className="w-full text-sm font-semibold text-slate-900 sm:ml-1 sm:w-auto sm:flex-1">
              {f.title}
            </h4>
          </div>
          <p className="mt-2 text-sm leading-snug text-slate-700">{f.detail}</p>
          {f.fix && (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{t(dict, 'report.gaps.fix')}: </span>
              {f.fix}
            </p>
          )}
          {f.lawRefs.length > 0 && (
            <p className="mt-2 rounded-lg bg-indigo-50/70 px-3 py-2 text-xs leading-snug text-indigo-900">
              <span className="font-semibold">{t(dict, 'report.gaps.why')}: </span>
              {f.lawRefs.join(' · ')}
            </p>
          )}
          {f.source_url && (
            <p className="mt-2 truncate text-[11px] text-slate-400">
              Quelle:{' '}
              <a href={f.source_url} className="underline-offset-2 hover:underline" rel="noreferrer">
                {f.source_url}
              </a>
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
