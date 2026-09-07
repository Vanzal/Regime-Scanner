/**
 * Live-Scan-Rauchprobe gegen eine echte Domain (Pilot-Verifikation von Schritt 3).
 * Nutzung: SCAN_MODE=live npx tsx scripts/live-scan-smoke.ts <domain> [sektor]
 * Respektiert robots.txt/Budget wie jeder echte Scan; Ausgabe: Findings + Urteile.
 */
import os from 'node:os'
import path from 'node:path'
import { getStore, resetStore } from '../src/lib/store'
import { runScan } from '../src/lib/scan/pipeline'
import type { Severity } from '../src/lib/store/types'

async function main(): Promise<void> {
  process.env.LOCAL_DB_PATH = path.join(os.tmpdir(), `rr-smoke-${Date.now()}.json`)
  resetStore()

  const domain = process.argv[2] ?? 'bsi.bund.de'
  const sector = process.argv[3] ?? 'it_dienst'

  const store = getStore()
  const company = await store.upsertCompanyByDomain({
    legal_name: `Smoke-Test ${domain}`,
    domain,
    country_hq: 'de',
    sector_nace: sector,
  })
  const scan = await store.createScan({
    company_id: company.id,
    mode: 'live',
    intake_json: {
      legal_name: `Smoke-Test ${domain}`,
      domain,
      country_hq: 'de',
      employees_band: '250_plus',
      revenue_band: 'gt_50m',
      balance_band: 'gt_43m',
      sector,
      designated_critical: false,
      qualified_trust_service: false,
      subsidiary_countries: [],
      supply_chain_critical: false,
      eu_customers_security_clauses: 'no',
      email: 'smoke@example.com',
      consent_marketing: true,
    },
  })

  const t0 = Date.now()
  await runScan(scan.id)
  const secs = ((Date.now() - t0) / 1000).toFixed(1)

  const done = await store.getScan(scan.id)
  const findings = await store.getFindingsByScan(scan.id)
  const assessments = await store.getAssessmentsByScan(scan.id)
  const rank: Record<Severity, number> = { high: 0, med: 1, low: 2, info: 3 }

  console.log(`\n=== Live-Scan ${domain} — ${secs}s, Treiber ${done?.driver_used}, Status ${done?.status} ===`)
  for (const f of findings.slice().sort((a, b) => rank[a.severity] - rank[b.severity])) {
    console.log(`[${f.severity.toUpperCase().padEnd(5)}] (${f.check_id}) ${f.title}`)
  }
  for (const a of assessments) {
    console.log(`→ ${a.regime}: ${a.applicable} (${Math.round(a.confidence * 100)} %) — ${a.rules_version}`)
  }
  console.log('Scan-ID für /admin:', scan.id)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
