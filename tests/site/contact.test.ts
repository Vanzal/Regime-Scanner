import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resetStore } from '@/lib/store'
import { sendContact } from '@/app/actions/contact'

function readContacts(): Array<{ email: string; name: string; message: string; company: string | null }> {
  if (!fs.existsSync(process.env.LOCAL_DB_PATH!)) return []
  return JSON.parse(fs.readFileSync(process.env.LOCAL_DB_PATH!, 'utf8')).contact_messages ?? []
}

beforeAll(() => {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `nexusscope-contact-${Date.now()}.json`)
  resetStore()
})

function fd(fields: Record<string, string>): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  return form
}

describe('Contact form (Server Action + File-Store)', () => {
  it('rejects invalid email and short messages without persisting', async () => {
    const bad = await sendContact({ ok: false }, fd({ name: 'A', email: 'nope', message: 'hi' }))
    expect(bad.ok).toBe(false)
    expect(bad.errors?.email || bad.errors?.name || bad.errors?.message).toBeTruthy()
    expect(readContacts()).toHaveLength(0)
  })

  it('persists a valid enquiry', async () => {
    const res = await sendContact(
      { ok: false },
      fd({
        name: 'Anna CISO',
        email: '  ANNA@beispielwerk.de ',
        company: 'Beispielwerk GmbH',
        message: 'We need orientation on NIS2 scope for two entities.',
      }),
    )
    expect(res.ok).toBe(true)
    expect(res.done).toBe(true)
    const row = readContacts().find((c) => c.email === 'anna@beispielwerk.de')
    expect(row?.name).toBe('Anna CISO')
    expect(row?.company).toBe('Beispielwerk GmbH')
    expect(row?.message).toMatch(/NIS2/)
  })
})
