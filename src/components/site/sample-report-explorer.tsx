'use client'

import dynamic from 'next/dynamic'
import { useState, type ReactNode } from 'react'
import type { SampleProfileId, SampleReportView } from '@/lib/sample-reports'
import type { SampleReportCardDict } from './sample-report-card'

const SampleReportCard = dynamic(() => import('./sample-report-card').then((m) => m.SampleReportCard))

export function SampleReportExplorer({
  reports,
  dict,
  initialCard,
}: {
  reports: SampleReportView[]
  dict: SampleReportCardDict
  /** Server-rendered default profile — not hydrated until the visitor switches tabs. */
  initialCard: ReactNode
}) {
  const [id, setId] = useState<SampleProfileId>('mittelstand-de')
  const p = dict.site.preview
  const labels: Record<SampleProfileId, string> = {
    'mittelstand-de': p.profile_de,
    'service-at': p.profile_at,
    'ch-eu-subsidiary': p.profile_ch,
  }
  const current = reports.find((r) => r.id === id) ?? reports[0]
  if (!current) return null

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
          {p.profiles_label}
        </p>
        <div role="tablist" aria-label={p.profiles_label} className="flex flex-wrap gap-2">
          {(Object.keys(labels) as SampleProfileId[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={id === key}
              data-testid={`sample-profile-${key}`}
              onClick={() => setId(key)}
              className={`rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
                id === key
                  ? 'border-[var(--ns-accent)] bg-[color-mix(in_oklch,var(--ns-accent)_12%,transparent)] text-[var(--ns-fg)]'
                  : 'border-[var(--ns-border)] text-[var(--ns-fg-muted)] hover:text-[var(--ns-fg)]'
              }`}
            >
              {labels[key]}
            </button>
          ))}
        </div>
      </div>
      {id === 'mittelstand-de' ? initialCard : <SampleReportCard report={current} dict={dict} />}
    </div>
  )
}
