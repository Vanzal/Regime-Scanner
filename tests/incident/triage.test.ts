import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { IncidentIntakeSchema } from '@/lib/incident/schema'
import { runIncidentTriage } from '@/lib/incident/triage'
import { createIncident, getIncidentByToken } from '@/lib/incident/store'
import { trafficLightFor, absoluteDeadlinesFrom } from '@/lib/incident/types'

const BASE = {
  description: 'Suspected unauthorized access to the admin console overnight.',
  discovered_at: '2026-09-08T08:00:00.000Z',
  systems_affected: 'Admin console, VPN',
  personal_data: 'unknown' as const,
  service_availability: 'degraded' as const,
  affected_persons: 'unknown' as const,
  country_hq: 'de' as const,
}

describe('Incident triage (Rules Engine)', () => {
  it('wertet Heimat-Regime als unclear und andere als not_applicable (ohne Branche)', () => {
    const intake = IncidentIntakeSchema.parse(BASE)
    const result = runIncidentTriage(intake, 'en')

    const de = result.regimes.find((r) => r.regime === 'de')!
    const at = result.regimes.find((r) => r.regime === 'at')!
    const ch = result.regimes.find((r) => r.regime === 'ch')!

    expect(de.applicable).toBe('unclear')
    expect(de.trafficLight).toBe('amber')
    expect(de.absoluteDeadlines.length).toBeGreaterThan(0)
    expect(de.authority.name.length).toBeGreaterThan(0)

    expect(at.applicable).toBe('not_applicable')
    expect(at.trafficLight).toBe('green')
    expect(at.absoluteDeadlines).toEqual([])

    expect(ch.applicable).toBe('not_applicable')
    expect(result.overallTrafficLight).toBe('amber')
  })

  it('berechnet absolute Fristen ab Kenntnisnahme', () => {
    const stages = [
      { key: 'erst', hours: 24, label: 'Erstmeldung' },
      { key: 'folge', hours: 72 },
    ]
    const abs = absoluteDeadlinesFrom(stages, '2026-09-08T08:00:00.000Z')
    expect(abs[0].due_at).toBe('2026-09-09T08:00:00.000Z')
    expect(abs[1].due_at).toBe('2026-09-11T08:00:00.000Z')
  })

  it('erzeugt EN-Entwurf mit Disclaimer und Behördenbezug', () => {
    const intake = IncidentIntakeSchema.parse(BASE)
    const result = runIncidentTriage(intake, 'en')
    expect(result.draft.locale).toBe('en')
    expect(result.draft.body.toLowerCase()).toContain('not legal advice')
    expect(result.draft.subject).toMatch(/DE/i)
    expect(result.draft.authorityName.length).toBeGreaterThan(0)
  })

  it('erzeugt DE-Entwurf und DSGVO-Checkliste bei personenbezogenen Daten', () => {
    const intake = IncidentIntakeSchema.parse({ ...BASE, personal_data: 'yes', country_hq: 'at' })
    const result = runIncidentTriage(intake, 'de')
    expect(result.draft.body).toContain('keine Rechtsberatung')
    expect(result.checklist.some((c) => c.id === 'gdpr_dpa')).toBe(true)
    expect(result.regimes.find((r) => r.regime === 'at')!.applicable).toBe('unclear')
    expect(result.regimes.find((r) => r.regime === 'de')!.applicable).toBe('not_applicable')
  })

  it('mappt Applicable auf Ampelfarben', () => {
    expect(trafficLightFor('applicable')).toBe('red')
    expect(trafficLightFor('unclear')).toBe('amber')
    expect(trafficLightFor('not_applicable')).toBe('green')
  })
})

describe('Incident token store', () => {
  const prev = process.env.INCIDENT_DB_PATH
  let tmp: string

  afterEach(() => {
    if (prev === undefined) delete process.env.INCIDENT_DB_PATH
    else process.env.INCIDENT_DB_PATH = prev
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { force: true })
  })

  it('speichert und lädt per Token (404-Semantik für Unbekannt)', () => {
    tmp = path.join(os.tmpdir(), `incident-test-${Date.now()}.json`)
    process.env.INCIDENT_DB_PATH = tmp
    const intake = IncidentIntakeSchema.parse(BASE)
    const triage = runIncidentTriage(intake, 'en')
    const record = createIncident({ locale: 'en', intake, triage })
    expect(getIncidentByToken(record.token)?.id).toBe(record.id)
    expect(getIncidentByToken('00000000-0000-0000-0000-000000000000')).toBeNull()
  })
})
