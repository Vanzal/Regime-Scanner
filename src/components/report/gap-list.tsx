import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportFinding } from '@/lib/report/data'

const SEVERITY_STYLE: Record<string, string> = {
  high: 'border-[var(--ns-danger)] text-[var(--ns-danger)]',
  med: 'border-[var(--ns-warning)] text-[var(--ns-warning)]',
  low: 'border-[var(--ns-accent)] text-[var(--ns-accent)]',
  info: 'border-[var(--ns-border-strong)] text-[var(--ns-fg-dim)]',
}

/** 3 · Lückenliste nach Schwere – Befund / Warum das Gesetz / Empfehlung. */
export function GapList({ findings, dict }: { findings: ReportFinding[]; dict: Dictionary }) {
  if (findings.length === 0) {
    return <p className="text-sm text-[var(--ns-fg-muted)]">{t(dict, 'report.gaps.empty')}</p>
  }
  return (
    <ol className="space-y-3">
      {findings.map((f, idx) => (
        <li
          key={f.id}
          data-testid="gap-item"
          className="ns-card p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--ns-fg-dim)]">#{idx + 1}</span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.info}`}
            >
              {t(dict, `report.gaps.severity.${f.severity}`)}
            </span>
            <span className="rounded-md border border-[var(--ns-border)] px-2 py-0.5 text-[11px] text-[var(--ns-fg-muted)]">
              {t(dict, 'report.gaps.check')}: {f.check_id}
            </span>
            <h4 className="w-full text-sm font-semibold text-[var(--ns-fg)] sm:ml-1 sm:w-auto sm:flex-1">
              {f.title}
            </h4>
          </div>
          <p className="mt-2 text-sm leading-snug text-[var(--ns-fg-muted)]">{f.detail}</p>
          {f.fix && (
            <p className="mt-2 text-sm text-[var(--ns-fg-muted)]">
              <span className="font-semibold text-[var(--ns-fg)]">{t(dict, 'report.gaps.fix')}: </span>
              {f.fix}
            </p>
          )}
          {f.lawRefs.length > 0 && (
            <p className="mt-2 rounded-lg border border-[var(--ns-border)] bg-[var(--ns-bg-panel)] px-3 py-2 text-xs leading-snug text-[var(--ns-fg)]">
              <span className="font-semibold">{t(dict, 'report.gaps.why')}: </span>
              {f.lawRefs.join(' · ')}
            </p>
          )}
          {f.source_url && (
            <p className="mt-2 truncate text-[11px] text-[var(--ns-fg-dim)]">
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
