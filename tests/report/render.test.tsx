import { describe, expect, it, beforeAll } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { getStore, resetStore } from '@/lib/store'
import { loadRules } from '@/lib/rules/loader'
import { evaluateAll } from '@/lib/rules/evaluate'
import { buildFactsFromIntake } from '@/lib/scan/facts'
import { IntakeSchema } from '@/lib/intake/schema'
import type { FindingInput } from '@/lib/store/types'
import { loadReport } from '@/lib/report/data'
import { ReportView } from '@/components/report/report-view'
import { getDict } from '@/i18n'
import fixture from '../../fixtures/scans/mittelstand-de.json'

const TOKEN = 'b7e2a1c0-3f4d-4a5b-8c9d-0e1f2a3b4c5d'

beforeAll(async () => {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `regime-radar-test-${Date.now()}.json`)
  resetStore()
  const store = getStore()
  const company = await store.upsertCompanyByDomain({
    legal_name: fixture.company.legal_name,
    domain: fixture.company.domain,
    country_hq: fixture.company.country_hq,
    sector_nace: fixture.company.sector_nace ?? null,
  })
  const scan = await store.createScan({
    company_id: company.id,
    mode: 'fixture',
    intake_json: fixture.intake as Record<string, unknown>,
  })
  await store.insertFindings(
    scan.id,
    fixture.findings.map(
      (f): FindingInput => ({
        ...f,
        severity: f.severity as FindingInput['severity'],
        evidence_json: f.evidence_json ?? {},
        source_url: f.source_url ?? null,
      }),
    ),
  )
  // Fixture-Intake gegen das echte Zod-Schema validieren (typsicher + Fixture-Selbsttest)
  const facts = buildFactsFromIntake(IntakeSchema.parse(fixture.intake))
  const verdicts = evaluateAll(loadRules(), facts)
  await store.replaceAssessments(
    scan.id,
    verdicts.map((v) => ({
      regime: v.regime,
      applicable: v.applicable,
      confidence: v.confidence,
      reasoning_md: v.reasoningMd,
      threshold_trace_json: v.thresholdTrace,
      deadlines_json: v.deadlines,
      rules_version: v.rulesVersionLabel,
    })),
  )
  await store.updateScan(scan.id, { status: 'done', finished_at: new Date().toISOString() })
  await store.releaseScan(scan.id)
  await store.createLead({
    company_id: company.id,
    email: fixture.intake.email,
    consent_marketing: true,
    report_token: TOKEN,
  })
})

describe('Bericht-Rendering (feste Abschnittsreihenfolge)', () => {
  it('rendert alle fünf Abschnitte in der vorgeschriebenen Reihenfolge', async () => {
    const data = await loadReport(TOKEN)
    expect(data).not.toBeNull()
    const dict = getDict('de')
    const html = renderToString(<ReportView data={data!} dict={dict} showChrome={false} />)

    const markers = [
      'section-verdicts',
      'section-clock',
      'section-gaps',
      'section-trace',
      'section-limits',
    ].map((id) => `data-testid="${id}"`)
    const positions = markers.map((m) => html.indexOf(m))
    positions.forEach((p, i) => expect(p, `Abschnitt ${markers[i]} fehlt`).toBeGreaterThan(-1))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)

    // Eine unabhängige Urteilskarte pro geladener Regeldatei (Step 1: nur DE;
    // nach Step 4 automatisch drei Karten DE/AT/CH ohne Teständerung)
    for (const file of loadRules()) {
      expect(html).toContain(`data-testid="verdict-card-${file.regime}"`)
    }
    expect(html).toContain('data-testid="verdict-card-de"')

    // Regeln-Version sichtbar (Auditierbarkeit)
    expect(html).toContain('DE-NIS2UmsuCG v1.1.0')

    // Lückenliste mit Befunden + „Warum das Gesetz das betrifft“
    expect(html).toContain('data-testid="gap-item"')
    expect(html).toContain('Warum das Gesetz das betrifft')

    // Meldeuhr für DE
    expect(html).toContain('data-testid="clock-de"')
    expect(html).toContain('Erstmeldung')
  })

  it('Scope-Check-Abschnitt: nur mit gültigem scope_check_json, zwischen Urteilen und Uhren', async () => {
    const store = getStore()
    const bundle = await store.getReportByToken(TOKEN)
    expect(bundle).not.toBeNull()
    const scanId = (await store.getLatestScanByCompany(bundle!.company.id))!.id
    const dict = getDict('de')

    // Ohne Scope-Check: Abschnitt entfällt komplett
    await store.updateScan(scanId, { scope_check_json: null })
    const without = renderToString(<ReportView data={(await loadReport(TOKEN))!} dict={dict} showChrome={false} />)
    expect(without).not.toContain('data-testid="scope-check-block"')

    // Mit gültigem Scope-Check: Abschnitt in fester Position (nach Abschnitt 1)
    await store.updateScan(scanId, {
      scope_check_json: {
        regimes: [
          { name: 'Germany', status: 'possible', reasoning: 'KI-Restbedingung' },
          { name: 'Austria', status: 'unlikely', reasoning: 'KI-Restbedingung' },
          { name: 'Switzerland', status: 'likely', reasoning: 'KI-Restbedingung' },
        ],
        summary: 'Richtungsabschätzung.',
        key_gaps: ['g1', 'g2', 'g3', 'g4'],
        next_steps: ['n1', 'n2', 'n3'],
        disclaimer: 'Richtungsscan, keine Rechtsberatung.',
      } as Record<string, unknown>,
    })
    const withScope = renderToString(<ReportView data={(await loadReport(TOKEN))!} dict={dict} showChrome={false} />)
    const positions = ['section-verdicts', 'section-scope', 'section-clock'].map((id) =>
      withScope.indexOf(`data-testid="${id}"`),
    )
    positions.forEach((p, i) => expect(p, `Abschnitt ${i} fehlt`).toBeGreaterThan(-1))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(withScope).toContain('WAHRSCHEINLICH ANWENDBAR')
    expect(withScope).toContain('Richtungsscan, keine Rechtsberatung.')

    // Aufräumen: andere Tests sehen den Grundzustand ohne KI-Abschnitt
    await store.updateScan(scanId, { scope_check_json: null })
  })

  it('unbekannter Token → kein Bericht', async () => {
    const none = await loadReport('00000000-0000-4000-8000-000000000000')
    expect(none).toBeNull()
  })

  it('DB-Datei bleibt nach dem Test verwertbar (Datei-Store-Semantik)', () => {
    expect(fs.existsSync(process.env.LOCAL_DB_PATH!)).toBe(true)
  })
})
