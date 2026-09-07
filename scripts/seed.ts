/**
 * Seed: 3 Demo-Firmen mit abgeschlossenen Scans aus fixtures/scans/.
 * Läuft ohne Supabase (lokaler Datei-Store .data/db.json) oder gegen ein
 * konfiguriertes Supabase-Projekt. Idempotent im Datei-Modus ( resettet .data).
 */
import fs from 'node:fs'
import path from 'node:path'
import { getStore, resetStore } from '../src/lib/store'
import { loadRules } from '../src/lib/rules/loader'
import { evaluateAll } from '../src/lib/rules/evaluate'
import { buildFactsFromIntake } from '../src/lib/scan/facts'
import type { IntakeAnswers } from '../src/lib/intake/schema'
import type { Applicable } from '../src/lib/rules/types'

// Feste IDs/Tokens, damit Demo-Links stabil bleiben.
const IDS: Record<string, { company: string; scan: string; lead: string; token: string }> = {
  'mittelstand-de': {
    company: 'c0000001-0000-4000-8000-000000000001',
    scan: 's0000001-0000-4000-8000-000000000001',
    lead: 'l0000001-0000-4000-8000-000000000001',
    token: 'b7e2a1c0-3f4d-4a5b-8c9d-0e1f2a3b4c5d',
  },
  'service-at': {
    company: 'c0000002-0000-4000-8000-000000000002',
    scan: 's0000002-0000-4000-8000-000000000002',
    lead: 'l0000002-0000-4000-8000-000000000002',
    token: 'a9d8e7f6-5b4c-4d3e-9f2a-1b0c9d8e7f6a',
  },
  'ch-eu-subsidiary': {
    company: 'c0000003-0000-4000-8000-000000000003',
    scan: 's0000003-0000-4000-8000-000000000003',
    lead: 'l0000003-0000-4000-8000-000000000003',
    token: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
  },
}

interface Fixture {
  slug: string
  company: { legal_name: string; domain: string; country_hq: string; sector_nace?: string }
  intake: IntakeAnswers
  findings: Array<{
    check_id: string
    severity: 'info' | 'low' | 'med' | 'high'
    title: string
    detail: string
    fix?: string
    control_refs: string[]
    evidence_json: Record<string, unknown>
    source_url?: string
  }>
}

function loadFixtures(): Fixture[] {
  const dir = path.join(process.cwd(), 'fixtures', 'scans')
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Fixture)
}

async function main() {
  const store = getStore()

  // Datei-Modus: sauberer Start (idempotentes Seeding).
  if (store.kind === 'file') {
    const dbPath = process.env.LOCAL_DB_PATH ?? path.join(process.cwd(), '.data', 'db.json')
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath)
  } else {
    console.log('Supabase-Backend aktiv – Seed fügt feste IDs hinzu; bei Wiederholung ggf. vorher leeren.')
  }

  // Rechtsstand ins Datenmodell (rules_versions), damit der Bericht ihn belegen kann.
  for (const file of loadRules()) {
    await store.upsertRulesVersion({
      regime: file.regime,
      version_label: file.version_label,
      effective_from: file.effective_from,
      source_url: file.source_urls[0],
      notes: `Lokal: ${path.join('rules', file.regime)}`,
    })
  }

  const rules = loadRules()
  const site = process.env.SITE_URL ?? 'http://localhost:3000'

  for (const fixture of loadFixtures()) {
    const ids = IDS[fixture.slug]
    const company = await store.upsertCompanyByDomain(
      {
        legal_name: fixture.company.legal_name,
        domain: fixture.company.domain,
        country_hq: fixture.company.country_hq,
        sector_nace: fixture.company.sector_nace ?? null,
      },
      ids.company,
    )
    const scan = await store.createScan(
      { company_id: company.id, mode: 'fixture', intake_json: fixture.intake as Record<string, unknown>, id: ids.scan },
    )
    await store.updateScan(scan.id, { status: 'running', started_at: new Date().toISOString() })
    await store.insertFindings(
      scan.id,
      fixture.findings.map((f) => ({ ...f, evidence_json: f.evidence_json ?? {}, source_url: f.source_url ?? null })),
    )

    const facts = buildFactsFromIntake(fixture.intake)
    await store.updateScan(scan.id, { facts_json: facts as unknown as Record<string, unknown> })

    const verdicts = evaluateAll(rules, facts)
    await store.replaceAssessments(
      scan.id,
      verdicts.map((v) => ({
        regime: v.regime,
        applicable: v.applicable as Applicable,
        confidence: v.confidence,
        reasoning_md: v.reasoningMd,
        threshold_trace_json: v.thresholdTrace,
        deadlines_json: v.deadlines,
        rules_version: v.rulesVersionLabel,
      })),
    )
    await store.updateScan(scan.id, {
      status: 'done',
      finished_at: new Date().toISOString(),
      driver_used: 'fixture',
    })
    await store.releaseScan(scan.id)
    await store.createLead(
      {
        company_id: company.id,
        email: fixture.intake.email,
        consent_marketing: fixture.intake.consent_marketing,
        report_token: ids.token,
        id: ids.lead,
      },
    )

    console.log(`✔ ${fixture.slug.padEnd(20)} ${site}/report/${ids.token}`)
    for (const v of verdicts) {
      console.log(`   ${v.regime.toUpperCase()}: ${v.applicable} (${Math.round(v.confidence * 100)} %) – ${v.rulesVersionLabel}`)
    }
  }

  resetStore()
  console.log('\nSeed fertig.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
