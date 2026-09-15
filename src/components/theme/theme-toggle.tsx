'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@/components/site/icons'
import { applySiteTheme, readStoredTheme } from '@/lib/theme'

export function ThemeToggle({ label }: { label: string }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(readStoredTheme() === 'dark')
  }, [])

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = isDark ? 'light' : 'dark'
        applySiteTheme(next)
        setIsDark(next === 'dark')
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--ns-border)] text-[var(--ns-fg-muted)] transition hover:border-[var(--ns-border-strong)] hover:text-[var(--ns-fg)]"
    >
      {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  )
}
