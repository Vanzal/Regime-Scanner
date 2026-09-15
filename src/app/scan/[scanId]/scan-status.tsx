'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/i18n'

interface StatusResponse {
  status: 'queued' | 'running' | 'done' | 'failed'
  released: boolean
  finished_at: string | null
}

/** Warteseite mit Polling (3 s) – schaltet auf den Bericht, sobald er frei ist. */
export function ScanStatusPanel({
  scanId,
  reportToken,
  emailSent,
  dict,
}: {
  scanId: string
  reportToken: string
  emailSent: boolean
  dict: Dictionary
}) {
  const router = useRouter()
  const [status, setStatus] = useState<StatusResponse['status'] | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const res = await fetch(`/api/scan-status/${scanId}?t=${encodeURIComponent(reportToken)}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('status')
        const body = (await res.json()) as StatusResponse
        if (cancelled) return
        setStatus(body.status)
        if (body.status === 'done' && body.released) {
          router.push(`/report/${reportToken}`)
          return
        }
        if (body.status !== 'failed') timer = setTimeout(poll, 3000)
      } catch {
        if (!cancelled) timer = setTimeout(poll, 3000)
      }
    }
    poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [scanId, reportToken, router])

  if (status === 'failed') {
    return (
      <div
        role="alert"
        className="rounded-[var(--ns-radius)] border border-[color-mix(in_oklch,var(--ns-danger)_45%,transparent)] bg-[color-mix(in_oklch,var(--ns-danger)_10%,transparent)] p-6 text-center"
      >
        <h2 className="text-base font-bold text-[var(--ns-danger)]">{dict.scan.failed_title}</h2>
        <p className="mt-2 text-sm text-[var(--ns-fg-muted)]">{dict.scan.failed_text}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-center" role="status" aria-live="polite">
      <div
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--ns-border-strong)] border-t-[var(--ns-accent)]"
        aria-hidden
      />
      <h2 className="text-base font-bold text-[var(--ns-fg)]">{dict.scan.running_title}</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--ns-fg-muted)]">
        {dict.scan.running_text}
      </p>
      {emailSent && <p className="text-xs text-[var(--ns-fg-dim)]">{dict.scan.email_note}</p>}
      {status === 'done' && (
        <p className="text-sm font-medium text-[var(--ns-accent)]">{dict.scan.pending_text_short}</p>
      )}
    </div>
  )
}
