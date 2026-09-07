import type { IntakeAnswers } from '@/lib/intake/schema'
import { IntakeSchema } from '@/lib/intake/schema'
import { loadRules } from '@/lib/rules/loader'
import { evaluateAll } from '@/lib/rules/evaluate'
import type { VerdictFacts } from '@/lib/rules/types'
import { buildFactsFromIntake } from './facts'
import { findFixtureByDomain } from './fixtures'
import { getStore } from '@/lib/store'
import type { FindingInput, Scan } from '@/lib/store/types'
import { Politeness } from '@/lib/collect/politeness'
import { createDnsCollector } from '@/lib/collect/dns'
import { createTlsCollector } from '@/lib/collect/tls'
import { selectDriver } from '@/lib/collect/driver'
import { orderedChecks } from '@/lib/checks'
import type { FindingDraft, ScanContext } from '@/lib/checks/types'

export const AUTO_RELEASE = process.env.AUTO_RELEASE !== 'false'

export function scanModeForNewScan(): Scan['mode'] {
  return process.env.SCAN_MODE === 'live' ? 'live' : 'fixture'
}

/**
 * Läuft einen Scan zu Ende: Fakten (Intake + Sammlung) → Urteile → Ablage.
 * Idempotent genug: ein bereits abgeschlossener Scan wird nicht erneut bearbeitet.
 */
export async function runScan(scanId: string): Promise<void> {
  const store = getStore()
  const scan = await store.getScan(scanId)
  if (!scan) throw new Error(`Scan ${scanId} nicht gefunden`)
  if (scan.status === 'done' || scan.status === 'running') {
    if (scan.status === 'done') return
    // abgebrochener Läufer darf neu gestartet werden (Hintergrund-Runner-Retry)
    if (scan.status === 'running' && scan.started_at && Date.now() - new Date(scan.started_at).getTime() < 10 * 60 * 1000) return
  }

  const company = (await store.listScans()).find((s) => s.scan.id === scanId)?.company
  if (!company) throw new Error(`Firma für Scan ${scanId} nicht gefunden`)

  await store.updateScan(scanId, { status: 'running', started_at: new Date().toISOString(), error: null })

  try {
    const intake = IntakeSchema.parse(scan.intake_json) as IntakeAnswers
    const facts: VerdictFacts = buildFactsFromIntake(intake)
    let findings: FindingInput[] = []
    let driverUsed: string

    if (scan.mode === 'fixture' || process.env.SCAN_MODE !== 'live') {
      const fixture = findFixtureByDomain(company.domain)
      if (fixture) {
        findings = fixture.findings.map((f) => ({
          check_id: f.check_id,
          severity: f.severity,
          title: f.title,
          detail: f.detail,
          fix: f.fix,
          control_refs: f.control_refs,
          evidence_json: f.evidence_json,
          source_url: f.source_url ?? null,
        }))
        driverUsed = 'fixture'
      } else {
        // Kein Fixture für diese Domain: Intake-Only-Bewertung ohne Lückenliste.
        driverUsed = 'fixture:intake-only'
      }
    } else {
      // Live-Pfad: Höflichkeits-Gate + Treiber, legal_pages zuerst (Fakten),
      // dann die übrigen Checks; ein gescheiterter Check wird ein info-Finding.
      const t0Live = Date.now()
      const politeness = new Politeness()
      const ctx: ScanContext = {
        company,
        scan,
        intake,
        facts,
        politeness,
        dns: createDnsCollector(),
        tls: createTlsCollector(),
        driver: selectDriver(),
        log: (msg) => console.log(`[scan ${scanId}] ${msg}`),
      }
      for (const check of orderedChecks()) {
        try {
          findings.push(...(await check.run(ctx)))
        } catch (err) {
          ctx.log(`Check ${check.id} fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`)
          findings.push({
            check_id: check.id,
            severity: 'info',
            title: 'Prüfung nicht möglich',
            detail: 'Diese Einzelprüfung ist technisch fehlgeschlagen und wurde übersprungen. Das ist keine Aussage über Ihre Sicherheit.',
            control_refs: [],
            evidence_json: { reason: 'check_error' },
            source_url: null,
          })
        }
      }
      driverUsed = `live:${politeness.stats.requests}req`
      ctx.log(
        `Höflichkeits-Statistik: ${JSON.stringify(politeness.stats)} (Dauer ${(Date.now() - t0Live) / 1000}s)`,
      )
    }

    const rules = loadRules()
    const verdicts = evaluateAll(rules, facts)

    await store.insertFindings(scanId, findings)
    await store.replaceAssessments(
      scanId,
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
    await store.updateScan(scanId, {
      status: 'done',
      finished_at: new Date().toISOString(),
      driver_used: driverUsed,
      facts_json: facts as unknown as Record<string, unknown>,
    })
    if (AUTO_RELEASE) await store.releaseScan(scanId)
  } catch (err) {
    await store.updateScan(scanId, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
