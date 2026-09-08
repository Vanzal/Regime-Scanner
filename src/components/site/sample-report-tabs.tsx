'use client'

import { useState } from 'react'
import type { Dictionary } from '@/i18n'

type TabId = 'regimes' | 'gaps' | 'deadlines'

const STATUS_PILL: Record<'in' | 'unclear' | 'out', string> = {
  // Gleiche Semantik wie der Verdict-Strip im echten Bericht:
  // anwendbar = grün, unklar = bernstein, nicht anwendbar = schiefer.
  in: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40',
  unclear: 'bg-amber-500/15 text-amber-300 ring-amber-400/40',
  out: 'bg-slate-500/15 text-slate-400 ring-slate-500/40',
}

const SEV_PILL: Record<string, string> = {
  high: 'bg-rose-500/15 text-rose-300 ring-rose-400/40',
  med: 'bg-amber-500/15 text-amber-300 ring-amber-400/40',
  info: 'bg-slate-500/15 text-slate-400 ring-slate-500/40',
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
    <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 shadow-2xl shadow-cyan-500/5">
      <div role="tablist" aria-label={p.title} className="flex flex-wrap border-b border-slate-700/80">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`px-5 py-3 text-sm font-semibold transition ${
              tab === tb.id
                ? 'border-b-2 border-cyan-400 text-cyan-300'
                : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8" data-testid="sample-report-panel">
        {tab === 'regimes' && (
          <div className="space-y-4">
            {(
              [
                { key: 'de', name: p.regime_de, status: 'in', reason: p.regime_de_reason },
                { key: 'at', name: p.regime_at, status: 'unclear', reason: p.regime_at_reason },
                { key: 'ch', name: p.regime_ch, status: 'out', reason: p.regime_ch_reason },
              ] as const
            ).map((r) => (
              <div key={r.key} data-testid={`sample-regime-${r.key}`} className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-slate-100">{r.name}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1 ${STATUS_PILL[r.status]}`}>
                    {r.status === 'in' ? p.status_in : r.status === 'unclear' ? p.status_unclear : p.status_out}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.reason}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'gaps' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{p.gaps_intro}</p>
            {(
              [
                { sev: 'high', text: p.gap1 },
                { sev: 'med', text: p.gap2 },
                { sev: 'med', text: p.gap3 },
              ] as const
            ).map((g, i) => (
              <div key={i} data-testid={`sample-gap-${i}`} className="flex items-start gap-4 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 sm:p-5">
                <span className={`mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${SEV_PILL[g.sev]}`}>
                  {dict.report.gaps.severity[g.sev]}
                </span>
                <p className="text-sm leading-relaxed text-slate-200">{g.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'deadlines' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{p.deadlines_intro}</p>
            {([p.deadline1, p.deadline2, p.deadline3] as const).map((d, i) => (
              <div key={i} data-testid={`sample-deadline-${i}`} className="flex items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 sm:p-5">
                <span className="w-20 shrink-0 rounded-lg bg-cyan-400/10 px-3 py-2 text-center font-mono text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/30">
                  {['24 h', '72 h', '30 d'][i]}
                </span>
                <p className="text-sm font-medium text-slate-200">{d}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/80 px-6 py-3 text-xs text-slate-500 sm:px-8">
        {p.disclaimer} {p.as_of}
      </div>
    </div>
  )
}
