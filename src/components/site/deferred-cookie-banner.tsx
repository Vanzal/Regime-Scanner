'use client'

import { useEffect, useState } from 'react'
import type { Dictionary } from '@/i18n'

type CookieCopy = Dictionary['site']['cookie']

/** Loads the consent banner after idle so it never contends with first paint. */
export function DeferredCookieBanner({ copy }: { copy: CookieCopy }) {
  const [Banner, setBanner] = useState<null | typeof import('./cookie-banner').CookieBanner>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void import('./cookie-banner').then((mod) => {
        if (!cancelled) setBanner(() => mod.CookieBanner)
      })
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(load)
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }
    const timer = window.setTimeout(load, 200)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  if (!Banner) return null
  return <Banner copy={copy} />
}
