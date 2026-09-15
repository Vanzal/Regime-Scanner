import { createFileStore } from './file-store'
import { createSupabaseStore, resolveSupabaseCredentials } from './supabase-store'
import type { Store } from './types'

let instance: Store | null = null

/**
 * Backend-Auswahl: mit gültiger Supabase-URL + Service-Role → Supabase,
 * sonst lokaler Datei-Store (.data/db.json) – inkl. leerer/ungültiger
 * Vercel-Env-Zeilen, die sonst `new URL('')` beim createClient werfen.
 */
export function getStore(): Store {
  if (instance) return instance
  instance = resolveSupabaseCredentials() ? createSupabaseStore() : createFileStore()
  return instance
}

/** Nur für Tests. */
export function resetStore(): void {
  instance = null
}

export type { Store } from './types'
export { createFileStore } from './file-store'
export { createSupabaseStore } from './supabase-store'
