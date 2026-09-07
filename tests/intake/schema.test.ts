import { describe, expect, it } from 'vitest'
import { IntakeSchema, SECTOR_KEYS, COUNTRY_KEYS } from '@/lib/intake/schema'

const VALID = {
  legal_name: 'Beispielwerk GmbH',
  domain: 'https://www.Beispielwerk.de/kontakt', // wird normalisiert
  country_hq: 'de',
  employees_band: '50_249',
  revenue_band: '10_50m',
  balance_band: '10_43m',
  sector: 'verarbeitendes_gewerbe',
  designated_critical: false,
  qualified_trust_service: false,
  subsidiary_countries: ['at'],
  supply_chain_critical: false,
  eu_customers_security_clauses: 'yes',
  email: 'CISO@Beispielwerk.de ',
  consent_marketing: true,
}

describe('Intake-Schema (8 Fragen + E-Mail-Gate)', () => {
  it('akzeptiert vollständige Angaben und normalisiert Domain/E-Mail', () => {
    const parsed = IntakeSchema.parse(VALID)
    expect(parsed.domain).toBe('www.beispielwerk.de')
    expect(parsed.email).toBe('ciso@beispielwerk.de')
    expect(parsed.subsidiary_countries).toEqual(['at'])
  })

  it('lehnt fehlende Einwilligung ab (E-Mail-Gate ist Pflicht)', () => {
    const res = IntakeSchema.safeParse({ ...VALID, consent_marketing: false })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.some((i) => i.message === 'consent_required')).toBe(true)
    }
  })

  it('lehnt ungültige Domains und E-Mail-Adressen ab', () => {
    expect(IntakeSchema.safeParse({ ...VALID, domain: 'beispielwerk' }).success).toBe(false)
    expect(IntakeSchema.safeParse({ ...VALID, email: 'nicht-eine-mail' }).success).toBe(false)
  })

  it('Bänder: nur bekannte Enum-Werte, „unknown" ist erlaubt (erzwingt unklar)', () => {
    expect(IntakeSchema.safeParse({ ...VALID, employees_band: 'unknown', revenue_band: 'unknown', balance_band: 'unknown' }).success).toBe(true)
    expect(IntakeSchema.safeParse({ ...VALID, employees_band: '50-249' }).success).toBe(false)
    expect(IntakeSchema.safeParse({ ...VALID, revenue_band: 'alles' }).success).toBe(false)
  })

  it('Sektor/Länder-Keys sind die kanonischen Keys der Regeln-Dateien', () => {
    // Der Sektor-Key muss in den YAML-Dateien exakt so vorkommen (Vertrag zwischen
    // Formular und Regeln – die Engine matched Strings, keine Übersetzung).
    const yaml = ['energie', 'verarbeitendes_gewerbe', 'it_dienst']
    for (const key of yaml) expect(SECTOR_KEYS).toContain(key)
    expect(COUNTRY_KEYS).toContain('at')
  })
})
