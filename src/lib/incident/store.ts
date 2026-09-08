import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Locale } from '@/i18n'
import type { IncidentIntake } from './schema'
import type { IncidentRecord, IncidentTriageResult } from './types'

interface IncidentDb {
  incidents: IncidentRecord[]
}

const EMPTY: IncidentDb = { incidents: [] }

function resolvePath(): string {
  return process.env.INCIDENT_DB_PATH ?? path.join(process.cwd(), '.data', 'incidents.json')
}

function readDb(): IncidentDb {
  const p = resolvePath()
  if (!fs.existsSync(p)) return structuredClone(EMPTY)
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8')) as Partial<IncidentDb>
    return { incidents: parsed.incidents ?? [] }
  } catch {
    return structuredClone(EMPTY)
  }
}

function writeDb(db: IncidentDb): void {
  const p = resolvePath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, p)
}

/**
 * Token-basierter Incident-Store (Datei, analog zum Free-Scan File-Store).
 * Unbekannte Tokens → null (Aufrufer mappt auf 404, nie 403).
 */
export function createIncident(input: {
  locale: Locale
  intake: IncidentIntake
  triage: IncidentTriageResult
  token?: string
  id?: string
}): IncidentRecord {
  const db = readDb()
  const record: IncidentRecord = {
    id: input.id ?? randomUUID(),
    token: input.token ?? randomUUID(),
    locale: input.locale,
    intake: input.intake,
    triage: input.triage,
    created_at: new Date().toISOString(),
  }
  db.incidents.push(record)
  writeDb(db)
  return record
}

export function getIncidentByToken(token: string): IncidentRecord | null {
  if (!token) return null
  const db = readDb()
  return db.incidents.find((i) => i.token === token) ?? null
}
