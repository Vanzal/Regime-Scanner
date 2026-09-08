import { describe, expect, it } from 'vitest'
import { loadRules } from '@/lib/rules/loader'
import { evaluateAll, evaluateRegime } from '@/lib/rules/evaluate'
import type { VerdictFacts } from '@/lib/rules/types'

const rules = loadRules()
const at = rules.find((f) => f.regime === 'at')!
const ch = rules.find((f) => f.regime === 'ch')!

function facts(over: Partial<VerdictFacts> = {}): VerdictFacts {
  return {
    legalName: 'Test Org',
    domain: 'test.at',
    countryHq: 'at',
    employees: { min: 50, max: 249 },
    revenueEur: { min: 10_000_001, max: 50_000_000 },
    balanceEur: { min: 10_000_001, max: 43_000_000 },
    sector: 'verarbeitendes_gewerbe',
    subsidiaries: [],
    designatedCritical: false,
    qualifiedTrustService: undefined,
    euCustomersWithSecurityClauses: 'no',
    supplyChainCritical: false,
    ...over,
  }
}

describe('AT-Engine (NISG 2024, § 24/§ 34)', () => {
  it('AT-Hauptsitz, Anhang-I-Sektor Energie, ≥ 250 MA → wesentlich anwendbar', () => {
    const v = evaluateRegime(at, facts({ sector: 'energie', employees: { min: 250 } }))
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('wesentliche')
  })

  it('mittleres Unternehmen (50–249) im Verarbeitenden Gewerbe → wichtig', () => {
    const v = evaluateRegime(at, facts())
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('Wichtige Einrichtung')
  })

  it('kleines Unternehmen (< 50 MA, < 10 Mio) in Anlage-II-artigem Sektor → unklar (NISV/Einstufung offen)', () => {
    const v = evaluateRegime(
      at,
      facts({ employees: { max: 49 }, revenueEur: { max: 9_999_999 }, balanceEur: { max: 9_999_999 }, sector: 'post' }),
    )
    expect(v.applicable).toBe('unclear')
    expect(v.confidence).toBe(0.8)
  })

  it('AT-Regel kennt keine Töchter-Erweiterung: DE-Hauptsitz → nicht anwendbar', () => {
    const v = evaluateRegime(at, facts({ countryHq: 'de' }))
    expect(v.applicable).toBe('not_applicable')
  })

  it('§ 34-Fristen: 24 h Frühwarnung, 72 h Meldung, 1 Monat Abschlussbericht', () => {
    const v = evaluateRegime(at, facts())
    expect(v.deadlines.stages.map((s) => s.hours)).toEqual([24, 72, 720])
    expect(v.deadlines.stages[0]?.label).toContain('Frühwarnung')
    expect(v.rulesVersionLabel).toBe('AT-NISG v1.1.0')
    expect(v.deadlines.authority.portal_url).toContain('nis.gv.at')
  })

  it('ohne Größenangaben in Anhang-II-Sektor → unklar @ 0.5', () => {
    const v = evaluateRegime(at, facts({ employees: undefined, revenueEur: undefined, balanceEur: undefined, sector: 'post' }))
    expect(v.applicable).toBe('unclear')
    expect(v.confidence).toBe(0.5)
    expect(v.thresholdTrace.missing_inputs.length).toBeGreaterThan(0)
  })
})

describe('CH-Engine (ISG Art. 74b/74e + indirekte Betroffenheit)', () => {
  it('CH-Hauptsitz, Energie-Sektor → meldepflichtig anwendbar (direkte 24-h-Pflicht)', () => {
    const v = evaluateRegime(ch, facts({ countryHq: 'ch', sector: 'energie' }))
    expect(v.applicable).toBe('applicable')
    expect(v.deadlines.stages[0]?.hours).toBe(24)
    expect(v.deadlines.stages.map((s) => s.hours)).toEqual([24, 336])
    expect(v.deadlines.authority.name).toContain('BACS')
    expect(v.deadlines.authority.portal_url).toContain('report.cyber.security.hub')
  })

  it('CH-Hauptsitz, nicht gelisteter Sektor (Banken) → unklar (Liste offen, Art. 74a Abs. 2)', () => {
    const v = evaluateRegime(ch, facts({ countryHq: 'ch', sector: 'banken' }))
    expect(v.applicable).toBe('unclear')
    expect(v.confidence).toBe(0.8)
  })

  it('CH-Hauptsitz + DE-Tochter, Banken → unklar über Faktor EU-Tochter (@ 0.4)', () => {
    const v = evaluateRegime(
      ch,
      facts({
        countryHq: 'ch',
        sector: 'banken',
        subsidiaries: [{ country: 'de', name: 'Tochter DE GmbH' }],
      }),
    )
    expect(v.applicable).toBe('unclear')
    expect(v.confidence).toBe(0.4)
    expect(v.reasoningMd).toContain('Indirekte Betroffenheit')
    expect(v.thresholdTrace.entries.some((e) => e.status === 'fired' && e.label.includes('Tochter'))).toBe(true)
  })

  it('CH-Hauptsitz ohne EU-Beziehungen und Sektor außerhalb → klar nicht anwendbar', () => {
    const v = evaluateRegime(
      ch,
      facts({
        countryHq: 'ch',
        sector: 'digital_infrastruktur',
        euCustomersWithSecurityClauses: 'no',
        supplyChainCritical: false,
      }),
    )
    // Digital-Infrastruktur ist gelistet (Cloud/Rechenzentren) → anwendbar
    expect(v.applicable).toBe('applicable')
  })

  it('CH-Hauptsitz, Sonstige, EU-Kunden mit Sicherheitsklauseln „unbekannt" → unklar mit offener Angabe', () => {
    const v = evaluateRegime(
      ch,
      facts({ countryHq: 'ch', sector: 'sonstige', euCustomersWithSecurityClauses: 'unknown' }),
    )
    expect(v.applicable).toBe('unclear')
    expect(v.thresholdTrace.entries.some((e) => e.status === 'undetermined')).toBe(true)
  })

  it('DE-Hauptsitz ohne CH-Bezug → nicht anwendbar (kein Faktor)', () => {
    const v = evaluateRegime(ch, facts({ countryHq: 'de', sector: 'energie' }))
    expect(v.applicable).toBe('not_applicable')
  })
})

describe('Drei Regimes – unabhängige Urteile im Verbund', () => {
  it('DE-Firma mit CH-Tochter: DE anwendbar, CH unklar (Faktor wirkt nur auf CH)', () => {
    const verdicts = evaluateAll(
      rules,
      facts({
        countryHq: 'de',
        sector: 'energie',
        subsidiaries: [{ country: 'ch', name: 'Tochter CH AG' }],
        euCustomersWithSecurityClauses: 'no',
        supplyChainCritical: false,
      }),
    )
    const de = verdicts.find((v) => v.regime === 'de')!
    const chv = verdicts.find((v) => v.regime === 'ch')!
    const atv = verdicts.find((v) => v.regime === 'at')!
    expect(de.applicable).toBe('applicable')
    expect(chv.applicable).toBe('not_applicable') // CH-Tochter begründet KEINE CH-Pflicht
    expect(atv.applicable).toBe('not_applicable')
  })

  it('alle drei Urteile tragen Regeln-Version und Melden-Fristen', () => {
    const verdicts = evaluateAll(rules, facts())
    for (const v of verdicts) {
      expect(v.rulesVersionLabel).toMatch(/v1\.1\.0/)
      expect(v.deadlines.stages.length).toBeGreaterThanOrEqual(2)
      expect(v.deadlines.authority.name.length).toBeGreaterThan(3)
    }
  })
})
