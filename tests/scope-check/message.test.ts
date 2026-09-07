import { describe, expect, it } from 'vitest'
import { buildScopeCheckUserMessage, countryOfOperation, euExposure } from '@/lib/scope-check/message'
import type { IntakeAnswers } from '@/lib/intake/schema'

function intake(over: Partial<IntakeAnswers> = {}): IntakeAnswers {
  return {
    legal_name: 'Muster GmbH',
    domain: 'muster.de',
    country_hq: 'de',
    employees_band: '50_249',
    revenue_band: '10_50m',
    balance_band: '10_43m',
    sector: 'verarbeitendes_gewerbe',
    designated_critical: false,
    qualified_trust_service: false,
    subsidiary_countries: [],
    supply_chain_critical: false,
    eu_customers_security_clauses: 'no',
    email: 'ops@muster.de',
    consent_marketing: true,
    ...over,
  }
}

describe('Scope-Check User-Message', () => {
  it('bildet alle 7 Zeilen aus dem Intake ab', () => {
    const msg = buildScopeCheckUserMessage(intake())
    expect(msg).toBe(
      [
        'Company sector: Manufacturing',
        'Primary country of operation: Germany',
        'Employee count: 50-249',
        'Approximate annual revenue: EUR 10M-50M',
        'Has EU subsidiaries or EU/DE/AT customers requiring contractual security compliance: No',
        'Already holds ISO 27001 or a similar certification: Not captured in this intake',
        'Brief description: Muster GmbH (website: muster.de)',
      ].join('\n'),
    )
  })

  it('Land: ch → Switzerland, unknown → Other/multiple', () => {
    expect(countryOfOperation('ch')).toBe('Switzerland')
    expect(countryOfOperation('unknown')).toBe('Other/multiple')
    expect(countryOfOperation('fr')).toBe('Other/multiple')
  })

  it('EU-Exposure: Klauseln ja → Yes', () => {
    expect(euExposure(intake({ eu_customers_security_clauses: 'yes' }))).toBe('Yes')
  })

  it('EU-Exposure: DE-Tochter trotz „no“ → Yes', () => {
    expect(euExposure(intake({ subsidiary_countries: ['de'], eu_customers_security_clauses: 'no' }))).toBe('Yes')
  })

  it('EU-Exposure: CH-Tochter ist keine EU-Tochter → No', () => {
    expect(euExposure(intake({ subsidiary_countries: ['ch'], eu_customers_security_clauses: 'no' }))).toBe('No')
  })

  it('EU-Exposure: „other“-Tochter bleibt offen → Unknown', () => {
    expect(euExposure(intake({ subsidiary_countries: ['other'], eu_customers_security_clauses: 'no' }))).toBe('Unknown')
  })

  it('EU-Exposure: Klauseln unknown → Unknown', () => {
    expect(euExposure(intake({ eu_customers_security_clauses: 'unknown' }))).toBe('Unknown')
  })

  it('ISO-Status wird abgebildet, wenn erhoben', () => {
    const msg = buildScopeCheckUserMessage(intake({ iso27001_certified: 'yes' }))
    expect(msg).toContain('ISO 27001 or a similar certification: Yes')
  })

  it('Bands werden lesbar übersetzt', () => {
    const msg = buildScopeCheckUserMessage(
      intake({ employees_band: '250_plus', revenue_band: 'gt_50m', sector: 'energie' }),
    )
    expect(msg).toContain('Employee count: 250 or more')
    expect(msg).toContain('Approximate annual revenue: over EUR 50M')
    expect(msg).toContain('Company sector: Energy')
  })
})
