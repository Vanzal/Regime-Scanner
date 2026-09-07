import { loadRules } from '@/lib/rules/loader'
import type { Applicable } from '@/lib/rules/types'
import { getStore } from '@/lib/store'
import type { AssessmentRow, Company, FindingRow, Scan } from '@/lib/store/types'

export interface ReportAssessment extends AssessmentRow {
  /** override gewinnt über Engine-Urteil */
  effectiveApplicable: Applicable
  effectiveReasoning: string
  /** generic ControlId → juristische Zitierung dieses Regimes */
  controlCites: Record<string, string>
}

export interface ReportFinding extends FindingRow {
  /** „Warum das Gesetz das betrifft“ – Zitierungen aller einschlägigen Regimes */
  lawRefs: string[]
}

export interface ReportData {
  company: Company
  scan: Pick<Scan, 'id' | 'mode' | 'finished_at' | 'review_status' | 'created_at'>
  findings: ReportFinding[]
  assessments: ReportAssessment[]
  rulesSources: Record<string, string[]>
}

const SEVERITY_RANK: Record<string, number> = { high: 0, med: 1, low: 2, info: 3 }
export function severityRank(s: string): number {
  return SEVERITY_RANK[s] ?? 9
}

function firstSentence(md: string): string {
  const m = md.match(/^[\s\S]*?[.!?](?=\s|$)/)
  const sentence = m ? m[0].trim() : md.trim()
  return sentence.length > 240 ? `${sentence.slice(0, 237)}…` : sentence
}

/** Token → vollständiger Bericht (inkl. Override-Koaleszenz und Control-Zitierungen). */
export async function loadReport(token: string): Promise<ReportData | null> {
  const store = getStore()
  const bundle = await store.getReportByToken(token)
  if (!bundle) return null

  let controlCitesByRegime: Record<string, Record<string, string>> = {}
  let rulesSources: Record<string, string[]> = {}
  try {
    for (const file of loadRules()) {
      controlCitesByRegime[file.regime] = file.control_areas
      rulesSources[file.regime] = file.source_urls
    }
  } catch {
    // Regeldateien fehlen/ungültig – Bericht rendert ohne Zitierungen weiter.
  }

  const assessments: ReportAssessment[] = bundle.assessments
    .slice()
    .sort((a, b) => a.regime.localeCompare(b.regime))
    .map((a) => ({
      ...a,
      effectiveApplicable: a.override_applicable ?? a.applicable,
      effectiveReasoning: a.override_reasoning_md ?? a.reasoning_md,
      controlCites: controlCitesByRegime[a.regime] ?? {},
    }))

  const applicableRegimes = assessments.filter((a) => a.effectiveApplicable !== 'not_applicable')

  const findings: ReportFinding[] = bundle.findings
    .slice()
    .sort((x, y) => severityRank(x.severity) - severityRank(y.severity))
    .map((f) => {
      const refs: string[] = []
      for (const a of applicableRegimes) {
        for (const ref of f.control_refs) {
          const cite = a.controlCites[ref]
          if (cite) refs.push(cite)
        }
      }
      return { ...f, lawRefs: [...new Set(refs)] }
    })

  return {
    company: bundle.company,
    scan: {
      id: bundle.scan.id,
      mode: bundle.scan.mode,
      finished_at: bundle.scan.finished_at,
      review_status: bundle.scan.review_status,
      created_at: bundle.scan.created_at,
    },
    findings,
    assessments,
    rulesSources,
  }
}

/** Für die „noch in Prüfung“-Ansicht: Lead existiert, Bericht noch nicht freigegeben. */
export async function loadReportPendingState(token: string): Promise<boolean> {
  const store = getStore()
  const lead = await store.getLeadByToken(token)
  if (!lead) return false
  const scan = await store.getLatestScanByCompany(lead.company_id)
  return scan !== null && scan.status === 'done' && scan.review_status !== 'released'
}
