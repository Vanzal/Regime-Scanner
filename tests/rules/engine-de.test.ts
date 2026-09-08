import { describe, expect, it } from 'vitest'
import { loadRules } from '@/lib/rules/loader'
import { evaluateAll, evaluateRegime } from '@/lib/rules/evaluate'
import type { VerdictFacts } from '@/lib/rules/types'

const rules = loadRules()
const de = rules.find((f) => f.regime === 'de')!

function facts(over: Partial<VerdictFacts> = {}): VerdictFacts {
  return {
    legalName: 'Test GmbH',
    domain: 'test.de',
    countryHq: 'de',
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

describe('DE-Engine (§ 28 BSIG-Schwellenwerte)', () => {
  it('≥250 Mitarbeitende in Anlage-1-Sektor → besonders wichtige Einrichtung', () => {
    const v = evaluateRegime(de, facts({ employees: { min: 250 }, sector: 'energie' }))
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('Anlage 1')
    expect(v.thresholdTrace.entries.some((e) => e.status === 'pass' && e.label.includes('Mitarbeitende ≥ 250'))).toBe(true)
  })

  it('50–249 Mitarbeitende im Verarbeitenden Gewerbe → wichtige Einrichtung', () => {
    const v = evaluateRegime(de, facts())
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('Wichtige Einrichtung, Anlage 1/2')
  })

  it('unter 50 Mitarbeitende → unterhalb der Schwellen → nicht anwendbar (Selbstprüfung-Hinweis)', () => {
    const v = evaluateRegime(de, facts({ employees: { max: 49 }, revenueEur: { max: 9_999_999 }, balanceEur: { max: 9_999_999 } }))
    expect(v.applicable).toBe('not_applicable')
    expect(v.confidence).toBe(0.8)
  })

  it('fehlende Größenangaben → unklar, Konfidenz 0.5, offene Angaben genannt', () => {
    const v = evaluateRegime(de, facts({ employees: undefined, balanceEur: undefined }))
    expect(v.applicable).toBe('unclear')
    expect(v.confidence).toBe(0.5)
    expect(v.unclearCode).toBe('missing_size_inputs')
    expect(v.thresholdTrace.missing_inputs.join(' ')).toMatch(/Mitarbeitende|Jahresbilanzsumme/)
  })

  it('Sektor außerhalb des Anwendungsbereichs → nicht anwendbar', () => {
    const v = evaluateRegime(de, facts({ sector: 'sonstige' }))
    expect(v.applicable).toBe('not_applicable')
    expect(v.confidence).toBe(0.8)
  })

  it('ohne Niederlassung in DE → nicht anwendbar', () => {
    const v = evaluateRegime(de, facts({ countryHq: 'at', sector: 'banken' }))
    expect(v.applicable).toBe('not_applicable')
    expect(v.reasoningMd).toContain('Niederlassung')
  })

  it('Telekommunikation: ≥50 MA → besonders wichtig (eigene Schwellenwerte)', () => {
    const v = evaluateRegime(de, facts({ sector: 'telekommunikation', employees: { min: 60 } }))
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('Telekommunikationsanbieter')
  })

  it('Telekommunikation klein mit bekannten niedrigen Werten → wichtig (Restfall)', () => {
    const v = evaluateRegime(
      de,
      facts({ sector: 'telekommunikation', employees: { max: 49 }, revenueEur: { max: 9_999_999 }, balanceEur: { max: 9_999_999 } }),
    )
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('§ 28 Abs. 2')
  })

  it('Vertrauensdiensteanbieter ohne eIDAS-Status → unklar (höhere Kategorie offen)', () => {
    const v = evaluateRegime(de, facts({ sector: 'vertrauensdiensteanbieter', qualifiedTrustService: undefined }))
    expect(v.applicable).toBe('unclear')
    expect(v.unclearCode).toBe('higher_class_undetermined')
    expect(v.reasoningMd).toContain('Qualifikationsstatus')
  })

  it('qualifizierter Vertrauensdiensteanbieter → besonders wichtig', () => {
    const v = evaluateRegime(de, facts({ sector: 'vertrauensdiensteanbieter', qualifiedTrustService: true }))
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('Qualifizierte Vertrauensdiensteanbieter')
  })

  it('amtlich eingestufte kritische Anlage → besonders wichtig, größenunabhängig', () => {
    const v = evaluateRegime(de, facts({ designatedCritical: true, employees: { max: 12 }, sector: 'sonstige' }))
    expect(v.applicable).toBe('applicable')
    expect(v.reasoningMd).toContain('kritischer Anlagen')
  })

  it('CH-Hauptsitz mit DE-Tochter, Digital-Infrastruktur ≥250 MA → anwendbar (Grenzfall über Tochter)', () => {
    const v = evaluateRegime(
      de,
      facts({ countryHq: 'ch', subsidiaries: [{ country: 'de', name: 'Tochter DE GmbH' }], sector: 'digital_infrastruktur', employees: { min: 400 } }),
    )
    expect(v.applicable).toBe('applicable')
  })

  it('jedes Urteil trägt Regeln-Version und Deadlines', () => {
    const v = evaluateRegime(de, facts())
    expect(v.rulesVersionLabel).toBe('DE-NIS2UmsuCG v1.1.0')
    expect(v.deadlines.stages.map((s) => s.hours)).toEqual([24, 72, 720])
    expect(v.deadlines.authority.name).toContain('Meldestelle')
  })

  it('evaluateAll liefert unabhängige Urteile pro Regime', () => {
    const verdicts = evaluateAll(rules, facts())
    expect(verdicts.length).toBe(rules.length)
    const regimes = new Set(verdicts.map((v) => v.regime))
    expect(regimes.has('de')).toBe(true)
  })
})
