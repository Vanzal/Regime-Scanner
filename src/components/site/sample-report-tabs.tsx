'use client'

import { useState } from 'react'
import type { Dictionary } from '@/i18n'

type TabId = 'regimes' | 'gaps' | 'deadlines'

const STATUS_TONE: Record<'in' | 'unclear' | 'out', string> = {
  in: 'border-[var(--ns-success)] text-[var(--ns-success)]',
  unclear: 'border-[var(--ns-warning)] text-[var(--ns-warning)] border-dashed',
  out: 'border-[var(--ns-border-strong)] text-[var(--ns-fg-dim)]',
}

const SEV_TONE: Record<string, string> = {
  high: 'border-[var(--ns-danger)] text-[var(--ns-danger)]',
  med: 'border-[var(--ns-warning)] text-[var(--ns-warning)]',
  info: 'border-[var(--ns-border-strong)] text-[var(--ns-fg-dim)]',
}

export function SampleReportTabs({ dict }: { dict: Dictionary }) {
  const [tab, setTab] = useState<TabId>('regimes')
  const p = dict.site.preview

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'regimes', label: p.tab_regimes },
    { id: 'gaps', label: p.tab_gaps },
    { id: 'deadlines', label: p.tab_deadlines },
  ]

  return (
    <div className="border-2 border-[var(--ns-fg)] bg-[var(--ns-bg-elevated)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--ns-border-strong)] bg-[var(--ns-bg-panel)] px-4 py-3 sm:px-5">
        <span className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
          nexusscope · sample-report
        </span>
        <span className="font-instrument text-[11px] text-[var(--ns-fg-dim)]">SYNTHETIC</span>
      </div>

      <div role="tablist" aria-label={p.title} className="flex flex-wrap border-b border-[var(--ns-border-strong)]">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`min-h-11 px-5 py-3 text-sm font-semibold transition-colors ${
              tab === tb.id
                ? 'bg-[var(--ns-fg)] text-[var(--ns-bg)]'
                : 'text-[var(--ns-fg-muted)] hover:text-[var(--ns-fg)]'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-8" data-testid="sample-report-panel">
        {tab === 'regimes' && (
          <div className="space-y-0">
            {(
              [
                { key: 'de', name: p.regime_de, status: 'in', reason: p.regime_de_reason },
                { key: 'at', name: p.regime_at, status: 'unclear', reason: p.regime_at_reason },
                { key: 'ch', name: p.regime_ch, status: 'out', reason: p.regime_ch_reason },
              ] as const
            ).map((r) => (
              <div
                key={r.key}
                data-testid={`sample-regime-${r.key}`}
                className="border-b border-[var(--ns-border)] py-5 last:border-0 last:pb-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold tracking-tight">{r.name}</span>
                  <span
                    className={`border px-2.5 py-1 font-instrument text-[11px] font-bold uppercase tracking-[0.12em] ${STATUS_TONE[r.status]}`}
                  >
                    {r.status === 'in' ? p.status_in : r.status === 'unclear' ? p.status_unclear : p.status_out}
                  </span>
                </div>
                <p className="font-reading mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{r.reason}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'gaps' && (
          <div className="space-y-5">
            <p className="font-reading text-sm text-[var(--ns-fg-muted)]">{p.gaps_intro}</p>
            {(
              [
                { sev: 'high', text: p.gap1 },
                { sev: 'med', text: p.gap2 },
                { sev: 'med', text: p.gap3 },
              ] as const
            ).map((g, i) => (
              <div key={i} data-testid={`sample-gap-${i}`} className="flex items-start gap-4">
                <span
                  className={`mt-0.5 shrink-0 border px-2.5 py-1 font-instrument text-[11px] font-bold uppercase tracking-[0.12em] ${SEV_TONE[g.sev]}`}
                >
                  {dict.report.gaps.severity[g.sev]}
                </span>
                <p className="font-reading text-sm leading-relaxed">{g.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'deadlines' && (
          <div className="space-y-4">
            <p className="font-reading text-sm text-[var(--ns-fg-muted)]">{p.deadlines_intro}</p>
            {([p.deadline1, p.deadline2, p.deadline3] as const).map((d, i) => (
              <div key={i} data-testid={`sample-deadline-${i}`} className="flex items-center gap-4">
                <span className="ns-clock flex h-14 w-[4.75rem] shrink-0 items-center justify-center font-display text-lg">
                  {['24 h', '72 h', '30 d'][i]}
                </span>
                <p className="text-sm font-medium leading-snug">{d}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--ns-border-strong)] px-5 py-3 font-reading text-xs text-[var(--ns-fg-dim)] sm:px-8">
        {p.disclaimer} {p.as_of}
      </div>
    </div>
  )
}
