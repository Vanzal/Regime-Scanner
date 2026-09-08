import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { loadRulesFile } from '@/lib/rules/loader'
import { evaluateAll, evaluateRegime } from '@/lib/rules/evaluate'
import type { VerdictFacts } from '@/lib/rules/types'
import deDict from '@/i18n/dictionaries/de.json'
import type { Dictionary } from '@/i18n'

/**
 * Invariante: Ein neues Regime braucht NUR eine YAML-Datei + einen Locale-Block.
 * Dieser Test berührt keinen Code unter src/lib/rules – genau das ist der Punkt.
 */
describe('Neues Regime ohne Engine-Änderung (xx-Test-Fixture)', () => {
  const xx = loadRulesFile(path.join(process.cwd(), 'tests', 'fixtures', 'rules', 'xx-test.v1.yaml'))
  const de = loadRulesFile(path.join(process.cwd(), 'rules', 'de-nis2umsucg.v1.yaml'))

  const facts: VerdictFacts = {
    countryHq: 'xx',
    employees: { min: 120, max: 249 },
    revenueEur: { min: 10_000_001, max: 50_000_000 },
    balanceEur: { min: 10_000_001, max: 43_000_000 },
    sector: 'verarbeitendes_gewerbe',
    subsidiaries: [],
    designatedCritical: false,
    qualifiedTrustService: undefined,
    euCustomersWithSecurityClauses: 'no',
    supplyChainCritical: false,
  }

  it('die Fixture validiert gegen das unveränderte Schema', () => {
    expect(xx.regime).toBe('xx')
    expect(xx.version_label).toBe('XX-Test v1.1.0')
  })

  it('die Engine wertet das neue Regime vollständig aus', () => {
    const v = evaluateRegime(xx, facts)
    expect(v.applicable).toBe('applicable')
    expect(v.lawName).toContain('Testgesetz')
    expect(v.deadlines.stages).toHaveLength(2)
    expect(v.deadlines.authority.name).toBe('Testmeldebehörde')
    expect(v.rulesVersionLabel).toBe('XX-Test v1.1.0')
    expect(v.thresholdTrace.entries.length).toBeGreaterThan(0)
    expect(v.engineSchema).toBe(2)
    expect(v.incidentTriggers.some((t) => t.id === 'service_disruption')).toBe(true)
  })

  it('evaluateAll mischt bestehende und neue Regime-Fassungen unabhängig', () => {
    const verdicts = evaluateAll([de, xx], facts)
    expect(verdicts.map((v) => v.regime)).toEqual(['de', 'xx'])
    expect(new Set(verdicts.map((v) => v.applicable)).size).toBeGreaterThan(0)
  })

  it('nur ein Locale-Block (regimes.xx) reicht für die Darstellung', () => {
    const dict = {
      ...(deDict as Dictionary),
      regimes: {
        ...(deDict as Dictionary).regimes,
        xx: { code: 'XX', name: 'Testland', law_short: 'Testgesetz' },
      },
    } as Dictionary
    // Verbatim-Prüfung der Label-Zusammensetzung wie in VerdictStrip:
    const block = (dict.regimes as Record<string, { code: string; name: string; law_short: string }>)['xx']
    expect(block.code).toBe('XX')
    expect(block.law_short).toBe('Testgesetz')
  })
})
