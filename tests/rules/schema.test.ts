import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { loadRules, loadRulesFile } from '@/lib/rules/loader'
import { RulesFileSchema } from '@/lib/rules/schema'

const ROOT = process.cwd()

describe('Regeldateien (Schema)', () => {
  it('alle Regeldateien im rules/-Verzeichnis validieren', () => {
    const files = loadRules() // fail-fast bei Schema-Verletzung
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      expect(f.source_urls.length).toBeGreaterThan(0)
      expect(f.entity_classes.length).toBeGreaterThan(0)
      expect(f.reporting_clock.stages.length).toBeGreaterThan(0)
      expect(f.incident_policy?.triggers.length).toBeGreaterThan(0)
      expect(f.engine_schema).toBeGreaterThanOrEqual(2)
    }
  })

  it('DE-Datei trägt den verifizierten Rechtsstand', async () => {
    const de = loadRulesFile(path.join(ROOT, 'rules', 'de-nis2umsucg.v1.yaml'))
    expect(de.regime).toBe('de')
    expect(de.effective_from).toBe('2025-12-06')
    expect(de.source_urls.some((u) => u.includes('recht.bund.de') || u.includes('bsi.bund.de'))).toBe(true)
  })

  it('ungültiges YAML/Schema wird abgelehnt', () => {
    expect(() => loadRulesFile(path.join(ROOT, 'tests', 'fixtures', 'rules', 'invalid-missing-source.yaml'))).toThrow(
      /verletzt das Schema/,
    )
  })

  it('fehlerhafte Bedingung (leeres Merkmalsbündel) wird abgelehnt', () => {
    const result = RulesFileSchema.safeParse({
      regime: 'de',
      version: 'v1',
      version_label: 'x',
      law_name: 'x',
      effective_from: '2025-12-06',
      source_urls: ['https://example.com'],
      applicability_country: 'de',
      entity_classes: [{ id: 'a', label: 'A', conditions: [{}] }],
      reporting_clock: {
        stages: [{ key: 'a', hours: 1 }],
        authority: { name: 'A', portal_url: 'https://example.com' },
      },
      control_areas: {},
    })
    expect(result.success).toBe(false)
  })
})
