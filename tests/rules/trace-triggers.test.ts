import { describe, expect, it } from 'vitest'
import path from 'node:path'
import {
  evaluateRegime,
  matchIncidentTriggers,
  evaluateAllWithIncidentSignals,
  selectLatestByRegime,
  versionNumber,
  loadRulesFile,
  loadRules,
} from '@/lib/rules'
import type { VerdictFacts } from '@/lib/rules/types'

const de = loadRulesFile(path.join(process.cwd(), 'rules', 'de-nis2umsucg.v1.yaml'))
const xx = loadRulesFile(path.join(process.cwd(), 'tests', 'fixtures', 'rules', 'xx-test.v1.yaml'))

function facts(over: Partial<VerdictFacts> = {}): VerdictFacts {
  return {
    countryHq: 'de',
    employees: { min: 50, max: 249 },
    revenueEur: { min: 10_000_001 },
    balanceEur: { min: 10_000_001 },
    sector: 'verarbeitendes_gewerbe',
    subsidiaries: [],
    designatedCritical: false,
    euCustomersWithSecurityClauses: 'no',
    supplyChainCritical: false,
    ...over,
  }
}

describe('Unclear-Codes & Threshold-Trace', () => {
  it('fehlende Branche → unclearCode missing_sector + strukturierte missing', () => {
    const v = evaluateRegime(de, facts({ sector: 'unknown' }))
    expect(v.applicable).toBe('unclear')
    expect(v.unclearCode).toBe('missing_sector')
    expect(v.thresholdTrace.unclear_code).toBe('missing_sector')
    expect(v.thresholdTrace.missing?.some((m) => m.key === 'sector')).toBe(true)
    expect(v.thresholdTrace.summary).toContain('unclear:missing_sector')
    expect(v.thresholdTrace.rules_version).toBe(de.version_label)
  })

  it('fehlende Größenangaben → missing_size_inputs mit input_key auf Bound-Zeilen', () => {
    const v = evaluateRegime(de, facts({ employees: undefined, balanceEur: undefined }))
    expect(v.unclearCode).toBe('missing_size_inputs')
    expect(v.thresholdTrace.entries.some((e) => e.input_key === 'employees' && e.status === 'undetermined')).toBe(
      true,
    )
    expect(v.thresholdTrace.entries.some((e) => e.code?.startsWith('bound.'))).toBe(true)
  })

  it('Treffer trägt matchedClassId und Trace-Codes', () => {
    const v = evaluateRegime(de, facts({ employees: { min: 250 }, sector: 'energie' }))
    expect(v.applicable).toBe('applicable')
    expect(v.matchedClassId).toBe('besonders_sonstige_anlage1')
    expect(v.thresholdTrace.matched_class_id).toBe('besonders_sonstige_anlage1')
    expect(v.thresholdTrace.summary).toContain('class:besonders_sonstige_anlage1')
    expect(v.thresholdTrace.entries.some((e) => e.code === 'class.besonders_sonstige_anlage1')).toBe(true)
  })

  it('below_threshold unclear → classification_open', () => {
    const at = loadRulesFile(path.join(process.cwd(), 'rules', 'at-nisg.v1.yaml'))
    const v = evaluateRegime(
      at,
      facts({
        countryHq: 'at',
        sector: 'post',
        employees: { max: 49 },
        revenueEur: { max: 9_999_999 },
        balanceEur: { max: 9_999_999 },
      }),
    )
    expect(v.unclearCode).toBe('classification_open')
  })
})

describe('Incident-Trigger (YAML incident_policy)', () => {
  it('DE-Trigger feuern bei degraded + personal_data yes', () => {
    const matches = matchIncidentTriggers(de, {
      service_availability: 'degraded',
      personal_data: 'yes',
      affected_persons: '1_99',
    })
    expect(matches.find((m) => m.id === 'service_disruption')?.status).toBe('fired')
    expect(matches.find((m) => m.id === 'personal_data_involved')?.status).toBe('fired')
    expect(matches.find((m) => m.id === 'large_affected_population')?.status).toBe('fail')
  })

  it('evaluateAllWithIncidentSignals hängt Trigger-Zeilen in den Trace', () => {
    const [v] = evaluateAllWithIncidentSignals(
      [de],
      facts({ sector: 'unknown' }),
      { service_availability: 'offline', personal_data: 'unknown', affected_persons: '1000_plus' },
    )
    expect(v.thresholdTrace.entries.some((e) => e.kind === 'trigger' && e.status === 'fired')).toBe(true)
    expect(v.incidentTriggers.length).toBeGreaterThan(0)
    expect(v.significanceNoteMd).toMatch(/§ 32/)
  })

  it('xx-Fixture-Trigger nur bei offline', () => {
    const fired = matchIncidentTriggers(xx, { service_availability: 'offline' })
    expect(fired[0]?.status).toBe('fired')
    const quiet = matchIncidentTriggers(xx, { service_availability: 'available' })
    expect(quiet[0]?.status).toBe('fail')
  })
})

describe('Loader: neueste Version je Regime', () => {
  it('versionNumber parst vN', () => {
    expect(versionNumber('v1')).toBe(1)
    expect(versionNumber('v12')).toBe(12)
    expect(versionNumber('nope')).toBe(0)
  })

  it('selectLatestByRegime behält die höhere version', () => {
    const older = { ...de, version: 'v1', version_label: 'old' }
    const newer = { ...de, version: 'v2', version_label: 'new' }
    const picked = selectLatestByRegime([older, newer, xx])
    expect(picked.find((f) => f.regime === 'de')?.version_label).toBe('new')
    expect(picked.map((f) => f.regime).sort()).toEqual(['de', 'xx'])
  })

  it('loadRules liefert genau ein Urteil je Regime und engine_schema ≥ 2', () => {
    const files = loadRules()
    const regimes = files.map((f) => f.regime)
    expect(new Set(regimes).size).toBe(regimes.length)
    for (const f of files) {
      expect(f.engine_schema).toBeGreaterThanOrEqual(2)
      expect(f.incident_policy?.triggers.length).toBeGreaterThan(0)
    }
  })
})
