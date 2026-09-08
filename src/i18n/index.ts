import de from './dictionaries/de.json'
import en from './dictionaries/en.json'

export type Locale = 'de' | 'en'

export const LOCALES: Locale[] = ['de', 'en']
/** Marketing-Site startet englischsprachig (NexusScope Spec); Cookie überschreibt. */
export const DEFAULT_LOCALE: Locale = 'en'

export type Dictionary = typeof de

const dictionaries: Record<Locale, Dictionary> = { de, en: en as Dictionary }

export function getDict(locale: Locale | undefined): Dictionary {
  return dictionaries[locale ?? DEFAULT_LOCALE]
}

/** Punkt-Lookup ('report.verdict.title') mit {var}-Interpolation. */
export function t(dict: Dictionary, key: string, vars?: Record<string, string | number>): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, dict)
  if (typeof value !== 'string') return key
  if (!vars) return value
  return value.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? `{${v}}`))
}

export function localeFromCookie(cookieValue: string | undefined): Locale {
  return cookieValue === 'de' ? 'de' : 'en'
}
