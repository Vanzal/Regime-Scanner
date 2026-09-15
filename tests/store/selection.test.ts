import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getStore, resetStore } from '@/lib/store'
import { resolveSupabaseCredentials } from '@/lib/store/supabase-store'

const KEYS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'LOCAL_DB_PATH'] as const

describe('resolveSupabaseCredentials + getStore fallback', () => {
  const previous: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of KEYS) previous[key] = process.env[key]
    process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `nexusscope-store-${Date.now()}-${Math.random()}.json`)
    resetStore()
  })

  afterEach(() => {
    resetStore()
    for (const key of KEYS) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  })

  it('returns null for empty Vercel-style SUPABASE_URL and uses the file store', () => {
    process.env.SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    expect(resolveSupabaseCredentials()).toBeNull()
    expect(getStore().kind).toBe('file')
  })

  it('treats whitespace-only SUPABASE_URL as missing', () => {
    process.env.SUPABASE_URL = '   '
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    expect(resolveSupabaseCredentials()).toBeNull()
    expect(getStore().kind).toBe('file')
  })

  it('does not throw Invalid URL for a malformed SUPABASE_URL', () => {
    process.env.SUPABASE_URL = '::::'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    expect(() => resolveSupabaseCredentials()).not.toThrow()
    expect(resolveSupabaseCredentials()).toBeNull()
    expect(getStore().kind).toBe('file')
  })

  it('returns null when the service-role key is missing', () => {
    process.env.SUPABASE_URL = 'https://abcd.supabase.co'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(resolveSupabaseCredentials()).toBeNull()
  })

  it('accepts a valid http(s) URL and key without calling createClient', () => {
    process.env.SUPABASE_URL = 'https://abcd.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    expect(resolveSupabaseCredentials()).toEqual({
      url: 'https://abcd.supabase.co',
      key: 'service-role',
    })
  })
})
