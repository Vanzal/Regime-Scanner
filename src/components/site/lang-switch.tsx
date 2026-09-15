'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

/** DE/EN switch: sets functional `lang` cookie (1 year) and refreshes. */
export function LangSwitch({
  locale,
  label,
}: {
  locale: 'de' | 'en'
  label: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const setLocale = (next: 'de' | 'en') => {
    if (next === locale) return
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-1" aria-label={label}>
      {(['en', 'de'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          disabled={pending}
          aria-pressed={locale === l}
          className={`min-h-8 rounded-md px-2.5 py-1 font-instrument text-xs font-semibold uppercase tracking-[0.12em] transition ${
            locale === l
              ? 'bg-[var(--ns-fg)] text-[var(--ns-bg)]'
              : 'text-[var(--ns-fg-dim)] hover:text-[var(--ns-fg)]'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
