import { describe, expect, it } from 'vitest'
import { IncidentIntakeSchema, INCIDENT_COUNTRY_KEYS } from '@/lib/incident/schema'

const VALID = {
  description: 'Ransomware encryption on file servers; customer portal down.',
  discovered_at: '2026-09-08T10:30',
  systems_affected: 'ERP, e-mail, customer portal',
  personal_data: 'yes',
  service_availability: 'offline',
  affected_persons: '100_999',
  country_hq: 'de',
}

describe('IncidentIntakeSchema', () => {
  it('akzeptiert vollständige Kurz-Angaben', () => {
    const parsed = IncidentIntakeSchema.parse(VALID)
    expect(parsed.country_hq).toBe('de')
    expect(parsed.personal_data).toBe('yes')
    expect(parsed.service_availability).toBe('offline')
  })

  it('lehnt zu kurze Beschreibung ab', () => {
    expect(IncidentIntakeSchema.safeParse({ ...VALID, description: 'kurz' }).success).toBe(false)
  })

  it('lehnt ungültige Zeitangaben ab', () => {
    expect(IncidentIntakeSchema.safeParse({ ...VALID, discovered_at: 'gestern' }).success).toBe(false)
  })

  it('erlaubt nur DE/AT/CH als Hauptniederlassung', () => {
    expect(INCIDENT_COUNTRY_KEYS).toEqual(['de', 'at', 'ch'])
    expect(IncidentIntakeSchema.safeParse({ ...VALID, country_hq: 'fr' }).success).toBe(false)
  })
})
