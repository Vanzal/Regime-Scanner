import type { SampleRegime, SampleReportView, SampleStatus } from '@/lib/sample-reports'
import type { Dictionary } from '@/i18n'
import { cn } from '@/lib/utils'

/** Slice of i18n needed to render a sample card (avoids shipping the full dictionary to the client). */
export type SampleReportCardDict = {
  site: { preview: Dictionary['site']['preview'] }
  report: {
    gaps: { severity: Dictionary['report']['gaps']['severity'] }
    clock: { none_applicable: string }
    confidence_bands: Dictionary['report']['confidence_bands']
    why_label: string
    unclear_hints: Dictionary['report']['unclear_hints']
    evidence_label: string
  }
}

const STATUS_CLASS: Record<SampleStatus, string> = {
  in: 'ns-status-in',
  out: 'ns-status-out',
  unclear: 'ns-status-unclear',
}

function statusLabel(dict: SampleReportCardDict, status: SampleStatus): string {
  if (status === 'in') return dict.site.preview.status_in
  if (status === 'out') return dict.site.preview.status_out
  return dict.site.preview.status_unclear
}

function confidenceBand(dict: SampleReportCardDict, regime: SampleRegime): string {
  const bands = dict.report.confidence_bands
  if (regime.status === 'out') return bands.confirmed
  if (regime.status === 'in') {
    return regime.confidence >= 0.75 ? bands.confirmed : bands.likely
  }
  const code = regime.unclearCode ?? ''
  if (code.startsWith('missing_')) return bands.insufficient
  return bands.needs_review
}

function nextAction(dict: SampleReportCardDict, regime: SampleRegime): string | null {
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

function shortHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.length > 42 ? `${url.slice(0, 40)}…` : url
  }
}

function shortReason(text: string, compact: boolean): string {
  if (!compact || text.length <= 140) return text
  return `${text.slice(0, 137).trimEnd()}…`
}

/**
 * Sample report card: Result → Reason → Evidence → Source → Confidence → Next step.
 * Server component — explorer loads a client copy only after the visitor switches tabs.
 */
export function SampleReportCard({
  report,
  dict,
  compact = false,
}: {
  report: SampleReportView
  dict: SampleReportCardDict
  compact?: boolean
}) {
  const p = dict.site.preview
  const applicable = report.regimes.filter((r) => r.status === 'in')
  const deadlineSource = applicable[0] ?? report.regimes[0]
  const gaps = compact ? report.gaps.slice(0, 2) : report.gaps.slice(0, 4)
  const testPrefix = report.id

  return (
    <article
      className="ns-card w-full min-w-0 overflow-hidden"
      data-testid={`sample-report-${report.id}`}
      aria-label={`${report.company.legal_name} sample report`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)] px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="break-words text-base font-semibold tracking-tight text-[var(--ns-fg)]">
            {report.company.legal_name}
          </p>
          <p className="mt-0.5 break-all font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {report.company.domain}
            <span className="mx-2 text-[var(--ns-border-strong)]">·</span>
            {report.company.country_hq.toUpperCase()}
          </p>
          {compact ? null : (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
              {report.company.sector} · {report.company.size}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-md border border-[var(--ns-warning)] px-2 py-1 font-instrument text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ns-warning)]"
          title={p.synthetic_hint}
        >
          {p.synthetic_badge}
        </span>
      </header>

      {!compact ? (
        <>
          <p className="border-b border-[var(--ns-border)] bg-[color-mix(in_oklch,var(--ns-warning)_8%,transparent)] px-4 py-2 text-xs text-[var(--ns-fg-muted)] sm:px-5">
            {p.demo_banner}
          </p>
          <p className="border-b border-[var(--ns-border)] bg-[var(--ns-bg)] px-4 py-2.5 text-xs leading-relaxed text-[var(--ns-fg-dim)] sm:px-5">
            {p.read_path}
          </p>
        </>
      ) : null}

      <div className={cn('grid w-full min-w-0 grid-cols-1 gap-0', compact ? '' : 'lg:grid-cols-3')}>
        <section
          className="border-b border-[var(--ns-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r"
          aria-labelledby={`${testPrefix}-regimes`}
        >
          <h3
            id={`${testPrefix}-regimes`}
            className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]"
          >
            {p.tab_regimes}
          </h3>
          <ul className="mt-3 space-y-4">
            {report.regimes.map((r) => {
              const band = confidenceBand(dict, r)
              const action = compact ? null : nextAction(dict, r)
              return (
                <li key={r.code} data-testid={`sample-regime-${report.id}-${r.code.toLowerCase()}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 text-sm font-semibold">
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
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
                    <span className="font-medium text-[var(--ns-fg-dim)]">{dict.report.why_label}:</span>{' '}
                    {shortReason(r.reason, compact)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ns-fg-dim)]">
                    <span data-testid={`sample-confidence-${report.id}-${r.code.toLowerCase()}`}>
                      {p.confidence_label}: {band}
                      {r.confidence > 0 ? ` · ${Math.round(r.confidence * 100)}%` : ''}
                    </span>
                    {!compact && r.sourceUrls[0] ? (
                      <a
                        href={r.sourceUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-[var(--ns-border)] underline-offset-2 hover:text-[var(--ns-fg-muted)]"
                      >
                        {p.source_label}: {shortHost(r.sourceUrls[0])}
                      </a>
                    ) : null}
                  </div>
                  {!compact && r.traceSummary ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
                      <span className="font-medium text-[var(--ns-fg-dim)]">{dict.report.evidence_label}:</span>{' '}
                      {r.traceSummary}
                    </p>
                  ) : null}
                  {action ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
                      <span className="font-medium text-[var(--ns-fg-dim)]">{p.col_next}:</span> {action}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>

        <section
          className="border-b border-[var(--ns-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r"
          aria-labelledby={`${testPrefix}-gaps`}
        >
          <h3
            id={`${testPrefix}-gaps`}
            className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]"
          >
            {p.tab_gaps}
          </h3>
          <ul className="mt-3 space-y-4">
            {gaps.map((g, i) => (
              <li
                key={`${g.title}-${i}`}
                className="text-sm leading-snug"
                data-testid={`sample-gap-${report.id}-${i}`}
              >
                <div>
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
                  <span className="font-medium">{g.title}</span>
                </div>
                {!compact && g.evidence ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
                    <span className="font-instrument text-[10px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                      {p.evidence_label}
                    </span>
                    <span className="mt-0.5 block font-instrument text-[11px] text-[var(--ns-fg-dim)]">
                      {g.evidence}
                    </span>
                  </p>
                ) : null}
                {!compact && g.sourceUrl ? (
                  <p className="mt-1 truncate text-[11px] text-[var(--ns-fg-dim)]">
                    {p.source_label}:{' '}
                    <a
                      href={g.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-[var(--ns-border)] underline-offset-2 hover:text-[var(--ns-fg-muted)]"
                    >
                      {shortHost(g.sourceUrl)}
                    </a>
                  </p>
                ) : null}
                {g.fix ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
                    <span className="font-semibold text-[var(--ns-fg)]">{p.next_step_label}: </span>
                    {g.fix}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="p-4 sm:p-5" aria-labelledby={`${testPrefix}-deadlines`}>
          <h3
            id={`${testPrefix}-deadlines`}
            className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]"
          >
            {p.tab_deadlines}
          </h3>
          {deadlineSource && deadlineSource.status === 'in' && deadlineSource.deadlines.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {deadlineSource.deadlines.slice(0, 3).map((d, i) => (
                <li
                  key={d.label}
                  className="flex min-w-0 items-center gap-3"
                  data-testid={`sample-deadline-${report.id}-${i}`}
                >
                  <span className="ns-clock flex h-11 w-16 shrink-0 items-center justify-center font-display text-sm">
                    {clockLabel(d.hours)}
                  </span>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium leading-snug">{d.label}</p>
                    <p className="truncate text-xs text-[var(--ns-fg-dim)]">
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
          {!compact && applicable.length > 0 ? (
            <p className="mt-4 text-xs leading-relaxed text-[var(--ns-fg-dim)]">{p.deadlines_note}</p>
          ) : null}
        </section>
      </div>

      <footer className="border-t border-[var(--ns-border)] px-4 py-3 text-xs leading-relaxed text-[var(--ns-fg-dim)] sm:px-5">
        {report.disclaimer}
      </footer>
    </article>
  )
}
