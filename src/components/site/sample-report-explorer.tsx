'use client'

import { useMemo, useState } from 'react'
import type { Dictionary } from '@/i18n'
import type { SampleProfileId, SampleReport } from '@/lib/sample-reports'
import { SampleReportCard } from './sample-report-card'

export function SampleReportExplorer({
  reports,
  dict,
}: {
  reports: SampleReport[]
  dict: Dictionary
}) {
  const [id, setId] = useState<SampleProfileId>('mittelstand-de')
  const p = dict.site.preview
  const labels: Record<SampleProfileId, string> = {
    'mittelstand-de': p.profile_de,
    'service-at': p.profile_at,
    'ch-eu-subsidiary': p.profile_ch,
  }
  const current = useMemo(() => reports.find((r) => r.id === id) ?? reports[0], [id, reports])
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
      <SampleReportCard report={current} dict={dict} />
    </div>
  )
}
