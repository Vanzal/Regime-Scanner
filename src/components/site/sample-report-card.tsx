'use client'

import type { SampleReport, SampleRegime, SampleStatus } from '@/lib/sample-reports'
import type { Dictionary } from '@/i18n'
import { cn } from '@/lib/utils'

const STATUS_CLASS: Record<SampleStatus, string> = {
  in: 'ns-status-in',
  out: 'ns-status-out',
  unclear: 'ns-status-unclear',
}

function statusLabel(dict: Dictionary, status: SampleStatus): string {
  if (status === 'in') return dict.site.preview.status_in
  if (status === 'out') return dict.site.preview.status_out
  return dict.site.preview.status_unclear
}

function confidenceBand(dict: Dictionary, regime: SampleRegime): string {
  const bands = dict.report.confidence_bands
  if (regime.status === 'out') return bands.confirmed
  if (regime.status === 'in') {
    return regime.confidence >= 0.75 ? bands.confirmed : bands.likely
  }
  const code = regime.unclearCode ?? ''
  if (code.startsWith('missing_')) return bands.insufficient
  return bands.needs_review
}

function nextAction(dict: Dictionary, regime: SampleRegime): string | null {
  if (regime.status === 'in') {
    const first = regime.deadlines[0]
    return first ? `${first.label} · ${first.authority}` : null
  }
  if (regime.status === 'out') return null
  const hints = dict.report.unclear_hints as Record<string, string>
  if (regime.unclearCode && hints[regime.unclearCode]) return hints[regime.unclearCode]
  return dict.site.preview.insufficient_hint
}

function clockLabel(hours: number): string {
  if (hours >= 720) return '30 d'
  if (hours >= 336 && hours < 720) return `${Math.round(hours / 24)} d`
  return `${hours} h`
}

export function SampleReportCard({
  report,
  dict,
  compact = false,
}: {
  report: SampleReport
  dict: Dictionary
  compact?: boolean
}) {
  const p = dict.site.preview
  const applicable = report.regimes.filter((r) => r.status === 'in')
  const deadlineSource = applicable[0] ?? report.regimes[0]
  const gaps = compact ? report.gaps.slice(0, 3) : report.gaps

  return (
    <div className="ns-card overflow-hidden" data-testid={`sample-report-${report.id}`}>
      <div className="flex flex-col gap-2 border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--ns-fg)]">{report.company.legal_name}</p>
          <p className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {report.company.domain}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {p.synthetic_badge}
          </span>
        </div>
      </div>

      {!compact ? (
        <p className="border-b border-[var(--ns-border)] bg-[color-mix(in_oklch,var(--ns-warning)_8%,transparent)] px-4 py-2 text-xs text-[var(--ns-fg-muted)] sm:px-5">
          {p.demo_banner}
        </p>
      ) : null}

      <div className={cn('grid gap-0', compact ? '' : 'lg:grid-cols-3')}>
        <section className="border-b border-[var(--ns-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <h3 className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {p.tab_regimes}
          </h3>
          <ul className="mt-3 space-y-4">
            {report.regimes.map((r) => {
              const band = confidenceBand(dict, r)
              const action = compact ? null : nextAction(dict, r)
              return (
                <li key={r.code} data-testid={`sample-regime-${report.id}-${r.code.toLowerCase()}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {r.name} — {r.law}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-md border px-2 py-0.5 font-instrument text-[10px] font-bold uppercase tracking-[0.12em]',
                        STATUS_CLASS[r.status],
                      )}
                    >
                      {statusLabel(dict, r.status)}
                    </span>
                  </div>
                  {compact ? null : (
                    <div className="mt-1.5 space-y-1 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
                      <p>
                        <span className="font-medium text-[var(--ns-fg-dim)]">{dict.report.why_label}:</span>{' '}
                        {r.reason}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--ns-fg-dim)]">{p.col_confidence}:</span>{' '}
                        {band}
                        {r.confidence > 0 ? ` · ${Math.round(r.confidence * 100)}%` : ''}
                      </p>
                      {r.traceSummary ? (
                        <p>
                          <span className="font-medium text-[var(--ns-fg-dim)]">{dict.report.evidence_label}:</span>{' '}
                          {r.traceSummary}
                        </p>
                      ) : null}
                      {action ? (
                        <p>
                          <span className="font-medium text-[var(--ns-fg-dim)]">{p.col_next}:</span> {action}
                        </p>
                      ) : null}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="border-b border-[var(--ns-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <h3 className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {p.tab_gaps}
          </h3>
          <ul className="mt-3 space-y-3">
            {gaps.map((g, i) => (
              <li key={`${g.title}-${i}`} className="text-sm leading-snug" data-testid={`sample-gap-${report.id}-${i}`}>
                <span
                  className={cn(
                    'mr-2 inline-block rounded-md border px-1.5 py-0.5 font-instrument text-[10px] font-bold uppercase tracking-[0.1em]',
                    g.severity === 'high'
                      ? 'border-[var(--ns-danger)] text-[var(--ns-danger)]'
                      : g.severity === 'med'
                        ? 'border-[var(--ns-warning)] text-[var(--ns-warning)]'
                        : 'border-[var(--ns-border-strong)] text-[var(--ns-fg-dim)]',
                  )}
                >
                  {dict.report.gaps.severity[g.severity]}
                </span>
                {g.title}
                {!compact && g.fix ? (
                  <p className="mt-1 text-xs text-[var(--ns-fg-muted)]">
                    <span className="font-medium text-[var(--ns-fg-dim)]">{dict.report.next_action_label}:</span>{' '}
                    {g.fix}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="p-4 sm:p-5">
          <h3 className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {p.tab_deadlines}
          </h3>
          {deadlineSource && deadlineSource.status === 'in' && deadlineSource.deadlines.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {deadlineSource.deadlines.slice(0, 3).map((d, i) => (
                <li key={d.label} className="flex items-center gap-3" data-testid={`sample-deadline-${report.id}-${i}`}>
                  <span className="ns-clock flex h-11 w-16 shrink-0 items-center justify-center font-display text-sm">
                    {clockLabel(d.hours)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{d.label}</p>
                    <p className="text-xs text-[var(--ns-fg-dim)]">
                      {d.authority}
                      {d.channel ? ` · ${d.channel}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--ns-fg-muted)]">{dict.report.clock.none_applicable}</p>
          )}
        </section>
      </div>

      <p className="border-t border-[var(--ns-border)] px-4 py-3 text-xs leading-relaxed text-[var(--ns-fg-dim)] sm:px-5">
        {report.disclaimer}
      </p>
    </div>
  )
}
