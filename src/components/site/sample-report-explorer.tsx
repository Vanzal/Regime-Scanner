'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n'
import type { SampleProfileId, SampleReport } from '@/lib/sample-reports'
import { SampleReportCard } from './sample-report-card'
import { cn } from '@/lib/utils'

export function SampleReportExplorer({
  reports,
  dict,
}: {
  reports: SampleReport[]
  dict: Dictionary
}) {
  const [id, setId] = useState<SampleProfileId>('mittelstand-de')
  const panelId = useId()
  const p = dict.site.preview
  const labels: Record<SampleProfileId, string> = {
    'mittelstand-de': p.profile_de,
    'service-at': p.profile_at,
    'ch-eu-subsidiary': p.profile_ch,
  }
  const current = useMemo(() => reports.find((r) => r.id === id) ?? reports[0], [id, reports])
  const tablistRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const selected = tablistRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    if (selected && document.activeElement?.getAttribute('role') === 'tab') {
      selected.focus()
    }
  }, [id])

  if (!current) return null

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
          {p.profiles_label}
        </p>
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={p.profiles_label}
          className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(Object.keys(labels) as SampleProfileId[]).map((key) => {
            const selected = id === key
            const tabId = `${panelId}-tab-${key}`
            return (
              <button
                key={key}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                data-testid={`sample-profile-${key}`}
                onClick={() => setId(key)}
                onKeyDown={(e) => {
                  const keys = Object.keys(labels) as SampleProfileId[]
                  const idx = keys.indexOf(id)
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    setId(keys[(idx + 1) % keys.length]!)
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    setId(keys[(idx - 1 + keys.length) % keys.length]!)
                  } else if (e.key === 'Home') {
                    e.preventDefault()
                    setId(keys[0]!)
                  } else if (e.key === 'End') {
                    e.preventDefault()
                    setId(keys[keys.length - 1]!)
                  }
                }}
                className={cn(
                  'min-h-11 shrink-0 rounded-[var(--ns-radius)] border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]',
                  selected
                    ? 'border-[var(--ns-accent)] bg-[color-mix(in_oklch,var(--ns-accent)_12%,transparent)] text-[var(--ns-fg)]'
                    : 'border-[var(--ns-border)] text-[var(--ns-fg-muted)] hover:text-[var(--ns-fg)]',
                )}
              >
                {labels[key]}
              </button>
            )
          })}
        </div>
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${id}`} className="min-w-0">
        <SampleReportCard report={current} dict={dict} key={current.id} />
      </div>
    </div>
  )
}
