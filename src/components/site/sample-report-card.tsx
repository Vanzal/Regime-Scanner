'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { SampleGap, SampleReport, SampleRegime, SampleStatus } from '@/lib/sample-reports'
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

function clockLabel(hours: number): string {
  if (hours >= 720) return '30 d'
  if (hours >= 336 && hours < 720) return `${Math.round(hours / 24)} d`
  return `${hours} h`
}

function confidencePct(confidence: number): number {
  return Math.round(Math.min(1, Math.max(0, confidence)) * 100)
}

type DetailTarget =
  | { kind: 'regime'; regime: SampleRegime }
  | { kind: 'gap'; gap: SampleGap; index: number }

function DetailDrawer({
  open,
  onClose,
  title,
  children,
  labelledBy,
  closeLabel,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  labelledBy: string
  closeLabel: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusables?.[0]?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_oklch,var(--ns-bg-ink)_72%,transparent)] backdrop-blur-[2px]"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="ns-card relative z-10 flex max-h-[min(92vh,40rem)] w-full max-w-lg flex-col overflow-hidden shadow-[0_24px_64px_color-mix(in_oklch,var(--ns-bg-ink)_55%,transparent)] sm:max-h-[min(88vh,36rem)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)] px-4 py-3 sm:px-5">
          <h3 id={labelledBy} className="min-w-0 text-base font-semibold tracking-tight text-[var(--ns-fg)]">
            {title}
          </h3>
          <button type="button" className="ns-btn-ghost shrink-0 !min-h-9 px-3 py-1.5 text-xs" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}

function RegimeRow({
  regime,
  dict,
  compact,
  reportId,
  onOpenWhy,
}: {
  regime: SampleRegime
  dict: Dictionary
  compact?: boolean
  reportId: string
  onOpenWhy: () => void
}) {
  const p = dict.site.preview
  const pct = confidencePct(regime.confidence)
  const [whyOpen, setWhyOpen] = useState(false)

  return (
    <li data-testid={`sample-regime-${reportId}-${regime.code.toLowerCase()}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">
            <span className="font-instrument text-[var(--ns-fg-dim)]">{regime.code}</span>
            <span className="mx-1.5 text-[var(--ns-fg-dim)]">·</span>
            {regime.law}
          </p>
          <p className="mt-0.5 text-xs text-[var(--ns-fg-muted)]">{regime.name}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md border px-2 py-0.5 font-instrument text-[10px] font-bold uppercase tracking-[0.12em]',
            STATUS_CLASS[regime.status],
          )}
        >
          {statusLabel(dict, regime.status)}
        </span>
      </div>

      <div className="mt-2.5" aria-label={`${p.col_confidence}: ${pct}%`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-instrument text-[10px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
            {p.col_confidence}
          </span>
          <span className="font-instrument text-[10px] tabular-nums text-[var(--ns-fg-muted)]">{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ns-ghost)]" role="presentation">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-300',
              regime.status === 'in'
                ? 'bg-[var(--ns-success)]'
                : regime.status === 'unclear'
                  ? 'bg-[var(--ns-warning)]'
                  : 'bg-[var(--ns-border-strong)]',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {compact ? null : (
        <div className="mt-2.5">
          <button
            type="button"
            className="ns-btn-ghost !min-h-8 px-2.5 py-1 text-xs"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((v) => !v)}
          >
            {whyOpen ? p.hide_why : p.why_action}
          </button>
          {whyOpen ? (
            <div className="mt-2 rounded-md border border-[var(--ns-border)] bg-[var(--ns-bg-panel)] p-3">
              <p className="text-xs leading-relaxed text-[var(--ns-fg-muted)]">{regime.reason}</p>
              {regime.unclearCode ? (
                <p className="mt-2 font-instrument text-[10px] uppercase tracking-[0.12em] text-[var(--ns-warning)]">
                  {regime.unclearCode}
                </p>
              ) : null}
              <button type="button" className="ns-link-action mt-2 text-xs" onClick={onOpenWhy}>
                {p.view_trace}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </li>
  )
}

function GapRow({
  gap,
  index,
  dict,
  reportId,
  compact,
  onOpen,
}: {
  gap: SampleGap
  index: number
  dict: Dictionary
  reportId: string
  compact?: boolean
  onOpen: () => void
}) {
  const p = dict.site.preview
  return (
    <li className="border-b border-[var(--ns-border)] pb-3 last:border-b-0 last:pb-0" data-testid={`sample-gap-${reportId}-${index}`}>
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={cn(
            'shrink-0 rounded-md border px-1.5 py-0.5 font-instrument text-[10px] font-bold uppercase tracking-[0.1em]',
            gap.severity === 'high'
              ? 'border-[var(--ns-danger)] text-[var(--ns-danger)]'
              : gap.severity === 'med'
                ? 'border-[var(--ns-warning)] text-[var(--ns-warning)]'
                : 'border-[var(--ns-border-strong)] text-[var(--ns-fg-dim)]',
          )}
        >
          {dict.report.gaps.severity[gap.severity]}
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-[var(--ns-fg)]">{gap.title}</p>
      </div>
      {compact ? null : (
        <>
          {gap.fix ? (
            <p className="mt-2 text-xs leading-relaxed text-[var(--ns-fg-muted)]">
              <span className="font-semibold text-[var(--ns-fg)]">{p.next_action}: </span>
              {gap.fix}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="ns-btn-ghost !min-h-8 px-2.5 py-1 text-xs" onClick={onOpen}>
              {p.view_evidence}
            </button>
            {gap.sourceUrl ? (
              <a
                href={gap.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ns-btn-ghost !min-h-8 px-2.5 py-1 text-xs"
              >
                {p.view_source}
              </a>
            ) : null}
          </div>
        </>
      )}
    </li>
  )
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
  const [detail, setDetail] = useState<DetailTarget | null>(null)
  const drawerTitleId = useId()
  const testPrefix = report.id

  return (
    <>
      <article
        className="ns-card overflow-hidden"
        data-testid={`sample-report-${report.id}`}
        aria-label={`${report.company.legal_name} sample report`}
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)] px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-[var(--ns-fg)]">
              {report.company.legal_name}
            </p>
            <p className="mt-0.5 font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
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
          <span className="shrink-0 rounded-md border border-dashed border-[var(--ns-border-strong)] px-2 py-1 font-instrument text-[10px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
            {p.synthetic_badge}
          </span>
        </header>

        <div className={cn('grid gap-0', compact ? '' : 'lg:grid-cols-3')}>
          <section className="border-b border-[var(--ns-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r" aria-labelledby={`${testPrefix}-regimes`}>
            <h3 id={`${testPrefix}-regimes`} className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
              {p.tab_regimes}
            </h3>
            <ul className="mt-4 space-y-4">
              {report.regimes.map((r) => (
                <RegimeRow
                  key={r.code}
                  regime={r}
                  dict={dict}
                  compact={compact}
                  reportId={report.id}
                  onOpenWhy={() => setDetail({ kind: 'regime', regime: r })}
                />
              ))}
            </ul>
          </section>

          <section className="border-b border-[var(--ns-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r" aria-labelledby={`${testPrefix}-gaps`}>
            <h3 id={`${testPrefix}-gaps`} className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
              {p.tab_gaps}
            </h3>
            <ul className="mt-4 space-y-3">
              {gaps.map((g, i) => (
                <GapRow
                  key={`${g.title}-${i}`}
                  gap={g}
                  index={i}
                  dict={dict}
                  reportId={report.id}
                  compact={compact}
                  onOpen={() => setDetail({ kind: 'gap', gap: g, index: i })}
                />
              ))}
            </ul>
          </section>

          <section className="p-4 sm:p-5" aria-labelledby={`${testPrefix}-deadlines`}>
            <h3 id={`${testPrefix}-deadlines`} className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
              {p.tab_deadlines}
            </h3>
            {deadlineSource && deadlineSource.status === 'in' && deadlineSource.deadlines.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {deadlineSource.deadlines.slice(0, 3).map((d, i) => (
                  <li key={d.label} className="flex items-center gap-3" data-testid={`sample-deadline-${report.id}-${i}`}>
                    <span className="ns-clock flex h-11 w-16 shrink-0 items-center justify-center font-display text-sm">
                      {clockLabel(d.hours)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{d.label}</p>
                      <p className="truncate text-xs text-[var(--ns-fg-dim)]">
                        {d.authority}
                        {d.channel ? ` · ${d.channel}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--ns-fg-muted)]">{dict.report.clock.none_applicable}</p>
            )}
          </section>
        </div>

        <footer className="border-t border-[var(--ns-border)] px-4 py-3 text-xs leading-relaxed text-[var(--ns-fg-dim)] sm:px-5">
          {report.disclaimer}
        </footer>
      </article>

      <DetailDrawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        labelledBy={drawerTitleId}
        closeLabel={p.drawer_close}
        title={
          detail?.kind === 'regime'
            ? `${detail.regime.code} · ${detail.regime.law}`
            : detail?.kind === 'gap'
              ? detail.gap.title
              : ''
        }
      >
        {detail?.kind === 'regime' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 font-instrument text-[10px] font-bold uppercase tracking-[0.12em]',
                  STATUS_CLASS[detail.regime.status],
                )}
              >
                {statusLabel(dict, detail.regime.status)}
              </span>
              <span className="font-instrument text-[11px] text-[var(--ns-fg-dim)]">
                {p.col_confidence}: {confidencePct(detail.regime.confidence)}%
              </span>
            </div>
            <div>
              <p className="font-instrument text-[11px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                {p.col_reason}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{detail.regime.reason}</p>
            </div>
            <div>
              <p className="font-instrument text-[11px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                {p.trace_label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{detail.regime.traceSummary}</p>
            </div>
          </div>
        ) : null}
        {detail?.kind === 'gap' ? (
          <div className="space-y-4">
            <div>
              <p className="font-instrument text-[11px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                {dict.report.gaps.what}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{detail.gap.detail}</p>
            </div>
            {detail.gap.fix ? (
              <div>
                <p className="font-instrument text-[11px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                  {p.next_action}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg)]">{detail.gap.fix}</p>
              </div>
            ) : null}
            {detail.gap.evidence ? (
              <div>
                <p className="font-instrument text-[11px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                  {p.evidence_label}
                </p>
                <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--ns-border)] bg-[var(--ns-bg-ink)] p-3 font-instrument text-[11px] leading-relaxed text-[var(--ns-fg-muted)]">
                  {JSON.stringify(detail.gap.evidence, null, 2)}
                </pre>
              </div>
            ) : null}
            {detail.gap.sourceUrl ? (
              <div>
                <p className="font-instrument text-[11px] uppercase tracking-[0.12em] text-[var(--ns-fg-dim)]">
                  {p.source_label}
                </p>
                <a
                  href={detail.gap.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ns-link-action mt-2 inline-block break-all text-sm"
                >
                  {detail.gap.sourceUrl}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailDrawer>
    </>
  )
}
