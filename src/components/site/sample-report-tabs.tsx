'use client'

import { useState } from 'react'
import type { Dictionary } from '@/i18n'

type TabId = 'regimes' | 'gaps' | 'deadlines'

const STATUS_TONE: Record<'in' | 'unclear' | 'out', string> = {
  in: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/35',
  unclear: 'bg-amber-500/15 text-amber-300 ring-amber-400/35',
  out: 'bg-slate-500/15 text-slate-400 ring-slate-500/35',
}

const SEV_TONE: Record<string, string> = {
  high: 'bg-rose-500/15 text-rose-300 ring-rose-400/35',
  med: 'bg-amber-500/15 text-amber-300 ring-amber-400/35',
  info: 'bg-slate-500/15 text-slate-400 ring-slate-500/35',
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
    <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0c1220] shadow-[0_24px_80px_-32px_rgba(34,211,238,0.25)]">
      <div className="flex items-center gap-2 border-b border-slate-700/70 bg-[#0a101c] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-600" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-600" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-600" aria-hidden="true" />
        <span className="ml-3 truncate font-mono text-[11px] text-slate-500">nexusscope · sample-report</span>
      </div>

      <div role="tablist" aria-label={p.title} className="flex flex-wrap border-b border-slate-700/70">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`px-5 py-3.5 text-sm font-semibold transition ${
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
              <div key={r.key} data-testid={`sample-regime-${r.key}`} className="border-b border-slate-800 py-4 last:border-0 last:pb-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-slate-100">{r.name}</span>
                  <span className={`rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ring-1 ${STATUS_TONE[r.status]}`}>
                    {r.status === 'in' ? p.status_in : r.status === 'unclear' ? p.status_unclear : p.status_out}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.reason}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'gaps' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-400">{p.gaps_intro}</p>
            {(
              [
                { sev: 'high', text: p.gap1 },
                { sev: 'med', text: p.gap2 },
                { sev: 'med', text: p.gap3 },
              ] as const
            ).map((g, i) => (
              <div key={i} data-testid={`sample-gap-${i}`} className="flex items-start gap-4">
                <span className={`mt-0.5 shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${SEV_TONE[g.sev]}`}>
                  {dict.report.gaps.severity[g.sev]}
                </span>
                <p className="text-sm leading-relaxed text-slate-200">{g.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'deadlines' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-400">{p.deadlines_intro}</p>
            {([p.deadline1, p.deadline2, p.deadline3] as const).map((d, i) => (
              <div key={i} data-testid={`sample-deadline-${i}`} className="flex items-center gap-4">
                <span className="w-[4.5rem] shrink-0 rounded-md bg-cyan-400/10 px-2.5 py-2 text-center font-mono text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/25">
                  {['24 h', '72 h', '30 d'][i]}
                </span>
                <p className="text-sm font-medium text-slate-200">{d}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/70 px-6 py-3 text-xs text-slate-500 sm:px-8">
        {p.disclaimer} {p.as_of}
      </div>
    </div>
  )
}
