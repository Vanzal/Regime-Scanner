import type { Applicable, ThresholdTrace, DeadlineInfo } from '@/lib/rules/types'

export interface Company {
  id: string
  legal_name: string
  domain: string
  country_hq: string
  employees?: number | null
  revenue_eur?: number | null
  sector_nace?: string | null
  created_at: string
}

export type ScanStatus = 'queued' | 'running' | 'done' | 'failed'
export type ReviewStatus = 'pending_review' | 'released'
export type ScanMode = 'live' | 'fixture'

export interface Scan {
  id: string
  company_id: string
  status: ScanStatus
  mode: ScanMode
  started_at?: string | null
  finished_at?: string | null
  driver_used?: string | null
  review_status: ReviewStatus
  released_at?: string | null
  intake_json: Record<string, unknown>
  facts_json: Record<string, unknown>
  /** LLM-Scope-Check (validiertes JSON aus src/lib/scope-check) – null = nicht gelaufen/gescheitert */
  scope_check_json?: Record<string, unknown> | null
  error?: string | null
  created_at: string
}

export type Severity = 'info' | 'low' | 'med' | 'high'

export interface FindingInput {
  check_id: string
  severity: Severity
  title: string
  detail: string
  fix?: string
  control_refs: string[]
  evidence_json: Record<string, unknown>
  source_url?: string | null
}

export interface FindingRow extends FindingInput {
  id: string
  scan_id: string
}

export interface AssessmentInput {
  regime: string
  applicable: Applicable
  confidence: number
  reasoning_md: string
  threshold_trace_json: ThresholdTrace
  deadlines_json: DeadlineInfo
  rules_version: string
}

export interface AssessmentRow extends AssessmentInput {
  id: string
  scan_id: string
  override_applicable?: Applicable | null
  override_reasoning_md?: string | null
  override_at?: string | null
}

export interface Lead {
  id: string
  company_id: string
  email: string
  consent_marketing: boolean
  report_token: string
  created_at: string
}

export interface RulesVersionRow {
  id: string
  regime: string
  version_label: string
  effective_from: string
  source_url: string
  notes?: string | null
}

/** Wartelisten-Eintrag der Marketing-Site (NexusScope MVP). */
export interface WaitlistEntry {
  id: string
  email: string
  company_size: string
  country: string
  pain_note: string | null
  created_at: string
}

export interface ReportBundle {
  company: Company
  scan: Scan
  findings: FindingRow[]
  assessments: AssessmentRow[]
}

export interface NewCompanyInput {
  legal_name: string
  domain: string
  country_hq: string
  sector_nace?: string | null
}

/** Ein zentrales Dateninterface mit zwei Backends: lokale Datei (Demo ohne
 *  Supabase-Projekt) und Supabase (Produktion). Schreibvorgänge laufen immer
 *  über die Service-Rolle; der Lesezugriff aus dem Report läuft über Token. */
export interface Store {
  readonly kind: 'file' | 'supabase'
  upsertCompanyByDomain(input: NewCompanyInput, id?: string): Promise<Company>
  createScan(input: { company_id: string; mode: ScanMode; intake_json: Record<string, unknown>; id?: string }): Promise<Scan>
  getScan(id: string): Promise<Scan | null>
  updateScan(id: string, patch: Partial<Omit<Scan, 'id'>>): Promise<void>
  insertFindings(scan_id: string, findings: FindingInput[]): Promise<void>
  getFindingsByScan(scan_id: string): Promise<FindingRow[]>
  replaceAssessments(scan_id: string, rows: AssessmentInput[]): Promise<void>
  getAssessmentsByScan(scan_id: string): Promise<AssessmentRow[]>
  setAssessmentOverride(id: string, patch: { override_applicable?: Applicable | null; override_reasoning_md?: string | null }): Promise<void>
  createLead(input: { company_id: string; email: string; consent_marketing: boolean; report_token: string; id?: string }): Promise<Lead>
  getLeadByToken(token: string): Promise<Lead | null>
  getLatestScanByCompany(companyId: string): Promise<Scan | null>
  getReportByToken(token: string): Promise<ReportBundle | null>
  listScans(): Promise<Array<{ scan: Scan; company: Company }>>
  releaseScan(scan_id: string): Promise<void>
  upsertRulesVersion(row: Omit<RulesVersionRow, 'id'>, id?: string): Promise<void>
  listRulesVersions(): Promise<RulesVersionRow[]>
  /** Idempotent: gleiche E-Mail → duplicate=true, Eintrag bleibt unverändert. */
  joinWaitlist(input: { email: string; company_size: string; country: string; pain_note?: string | null }): Promise<{ entry: WaitlistEntry; duplicate: boolean }>
}
