'use client'

import { useEffect, useState } from 'react'
import type { Dictionary } from '@/i18n'

const STORAGE_KEY = 'nexuscookieok'

/** DSGVO-Hinweisbanner: dokumentiert den funktionalen 'lang'-Cookie; keine
 *  Tracking-Cookies, also genügt ein einmaliges „Verstanden“ (localStorage). */
export function CookieBanner({ dict }: { dict: Dictionary }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // Speicherzugriff verweigert: Banner einfach nicht zeigen.
    }
  }, [])

  if (!visible) return null

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ohnehin nur Komfort
    }
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label={dict.site.cookie.accept}
      data-testid="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700/80 bg-slate-950/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs leading-relaxed text-slate-400">{dict.site.cookie.text}</p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          {dict.site.cookie.accept}
        </button>
      </div>
    </div>
  )
}
