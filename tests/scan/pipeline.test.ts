import { describe, expect, it, beforeAll } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import { getStore, resetStore } from '@/lib/store'
import { runScan } from '@/lib/scan/pipeline'
import { loadRules } from '@/lib/rules/loader'
import fixture from '../../fixtures/scans/service-at.json'

const TOKEN_NO_FIXTURE = 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f1'
const TOKEN_FIXTURE = 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f2'

const state: { s1?: string; s2?: string } = {}

beforeAll(async () => {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `regime-radar-pipeline-${Date.now()}.json`)
  delete process.env.AUTO_RELEASE // Standard: sofort freigeben
  resetStore()
  const store = getStore()

  // 1) Firma ohne passendes Fixture → Intake-Only-Pfad
  const c1 = await store.upsertCompanyByDomain({
    legal_name: 'Neue Firma GmbH',
    domain: 'neue-firma.de',
    country_hq: 'de',
  })
  const s1 = await store.createScan({
    company_id: c1.id,
    mode: 'fixture',
    intake_json: { ...fixture.intake, domain: 'neue-firma.de', email: 'test@neue-firma.de' },
  })
  await store.createLead({
    company_id: c1.id,
    email: 'test@neue-firma.de',
    consent_marketing: true,
    report_token: TOKEN_NO_FIXTURE,
  })
  await runScan(s1.id)
  state.s1 = s1.id

  // 2) Fixture-Domain → voller Fixture-Pfad mit Befunden
  const c2 = await store.upsertCompanyByDomain({
    legal_name: fixture.company.legal_name,
    domain: fixture.company.domain,
    country_hq: fixture.company.country_hq,
  })
  const s2 = await store.createScan({
    company_id: c2.id,
    mode: 'fixture',
    intake_json: fixture.intake as Record<string, unknown>,
  })
  await store.createLead({
    company_id: c2.id,
    email: 'x@example.com',
    consent_marketing: true,
    report_token: TOKEN_FIXTURE,
  })
  await runScan(s2.id)
  state.s2 = s2.id
})

describe('Scan-Pipeline (Fixture-Modus)', () => {
  it('Domain ohne Fixture → Scan done, Intake-Urteile, keine Befunde', async () => {
    const store = getStore()
    const scan = await store.getScan(state.s1!)
    expect(scan?.status).toBe('done')
    expect(scan?.driver_used).toBe('fixture:intake-only')
    expect(scan?.review_status).toBe('released')
    expect(await store.getFindingsByScan(scan!.id)).toHaveLength(0)
    const assessments = await store.getAssessmentsByScan(scan!.id)
    expect(assessments).toHaveLength(loadRules().length)
    // Pro Regime genau ein Urteil mit korrekter Versionsmarke (Reihenfolge egal)
    expect(assessments.map((a) => a.regime).sort()).toEqual(['at', 'ch', 'de'])
    expect(assessments.find((a) => a.regime === 'de')?.rules_version).toBe('DE-NIS2UmsuCG v1.0.0')
    // Der Lead kann den fertigen Bericht abrufen (Release erzwungen)
    const bundle = await store.getReportByToken(TOKEN_NO_FIXTURE)
    expect(bundle?.scan.id).toBe(state.s1)
  })

  it('Fixture-Domain → Befunde vorhanden, Bericht über Lead-Token abrufbar', async () => {
    const store = getStore()
    const scan = await store.getScan(state.s2!)
    expect(scan?.status).toBe('done')
    expect(scan?.driver_used).toBe('fixture')
    expect((await store.getFindingsByScan(scan!.id)).length).toBeGreaterThan(0)
    const bundle = await store.getReportByToken(TOKEN_FIXTURE)
    expect(bundle?.scan.id).toBe(state.s2)
    expect(bundle?.assessments).toHaveLength(loadRules().length)
  })

  it('bereits abgeschlossener Scan wird nicht erneut gelaufen (idempotent)', async () => {
    const store = getStore()
    await runScan(state.s2!)
    const findings = await store.getFindingsByScan(state.s2!)
    expect(findings.length).toBeGreaterThan(0)
  })
})
