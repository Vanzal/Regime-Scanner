'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

/** DE/EN-Umschalter: setzt den funktionalen Cookie 'lang' (1 Jahr) und refresht. */
export function LangSwitch({
  locale,
  label,
  variant = 'dark',
}: {
  locale: 'de' | 'en'
  label: string
  /** dark = Marketing-Footer; light = Intake/Incident auf hellem Grund */
  variant?: 'dark' | 'light'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const setLocale = (next: 'de' | 'en') => {
    if (next === locale) return
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  const active =
    variant === 'light'
      ? 'bg-slate-900 text-white'
      : 'bg-slate-700/80 text-cyan-300'
  const idle =
    variant === 'light'
      ? 'text-slate-500 hover:text-slate-800'
      : 'text-slate-500 hover:text-slate-300'

  return (
    <div className="flex items-center gap-1" aria-label={label}>
      {(['en', 'de'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          disabled={pending}
          aria-pressed={locale === l}
          className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide transition ${
            locale === l ? active : idle
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
