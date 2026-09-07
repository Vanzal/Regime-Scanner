import { createFileStore } from './file-store'
import { createSupabaseStore } from './supabase-store'
import type { Store } from './types'

let instance: Store | null = null

/**
 * Backend-Auswahl: mit Supabase-Zugangsdaten → Supabase (Produktion),
 * sonst lokaler Datei-Store (.data/db.json) – Demo ohne Supabase-Projekt.
 */
export function getStore(): Store {
  if (instance) return instance
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    instance = createSupabaseStore()
  } else {
    instance = createFileStore()
  }
  return instance
}

/** Nur für Tests. */
export function resetStore(): void {
  instance = null
}

export type { Store } from './types'
export { createFileStore } from './file-store'
export { createSupabaseStore } from './supabase-store'
