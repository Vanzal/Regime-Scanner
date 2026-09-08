import { describe, expect, it, beforeAll } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { resetStore } from '@/lib/store'
import { joinWaitlist } from '@/app/actions/waitlist'

function readWaitlist(): Array<{ email: string; company_size: string; country: string; pain_note: string | null }> {
  if (!fs.existsSync(process.env.LOCAL_DB_PATH!)) return [] // noch nie geschrieben = leer
  return JSON.parse(fs.readFileSync(process.env.LOCAL_DB_PATH!, 'utf8')).waitlist
}

beforeAll(() => {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `nexusscope-waitlist-${Date.now()}.json`)
  resetStore()
})

function fd(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const VALID = {
  email: 'ciso@beispielwerk.de',
  company_size: '50_249',
  country: 'de',
}

describe('Warteliste (Server Action + File-Store)', () => {
  it('ungültige Eingaben → ok=false mit Feldfehlern, nichts persistiert', async () => {
    const bad = await joinWaitlist({ ok: false }, fd({ email: 'keine-mail', company_size: '50_249', country: 'xx' }))
    expect(bad.ok).toBe(false)
    expect(bad.errors?.email).toBeTruthy()
    expect(bad.errors?.country).toBeTruthy()
    expect(readWaitlist()).toHaveLength(0)
  })

  it('erster Eintrag → done, duplicate=false, Eintrag im Store (E-Mail normalisiert)', async () => {
    const res = await joinWaitlist({ ok: false }, fd({ ...VALID, email: `  ${VALID.email.toUpperCase()}  ` }))
    expect(res.ok).toBe(true)
    expect(res.done).toBe(true)
    expect(res.duplicate).toBe(false)

    const entry = readWaitlist().find((w) => w.email === VALID.email)
    expect(entry).toBeTruthy()
    expect(entry?.company_size).toBe('50_249')
    expect(entry?.country).toBe('de')
    expect(entry?.pain_note).toBeNull()
  })

  it('gleiche E-Mail erneut → duplicate=true, kein zweiter Eintrag', async () => {
    const res = await joinWaitlist({ ok: false }, fd(VALID))
    expect(res.done).toBe(true)
    expect(res.duplicate).toBe(true)

    const entries = readWaitlist().filter((w) => w.email === VALID.email)
    expect(entries).toHaveLength(1)
  })

  it('optionale Notiz wird gespeichert (getrimmt, ≤500 Zeichen)', async () => {
    await joinWaitlist(
      { ok: false },
      fd({ email: 'notiz@firma.at', company_size: '250_plus', country: 'at', pain_note: '  Lieferketten-Anhang 3 unklar  ' }),
    )
    const entry = readWaitlist().find((w) => w.email === 'notiz@firma.at')
    expect(entry?.pain_note).toBe('Lieferketten-Anhang 3 unklar')
  })
})
