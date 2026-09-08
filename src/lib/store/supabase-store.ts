import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import type {
  AssessmentInput,
  AssessmentRow,
  Company,
  FindingInput,
  FindingRow,
  Lead,
  ReportBundle,
  RulesVersionRow,
  Scan,
  Store,
  WaitlistEntry,
} from './types'

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY sind für den Supabase-Store erforderlich')
  }
  // Service-Rolle: alle Schreibvorgänge laufen serverseitig; RLS (0002_rls.sql)
  // verweigert anon/authenticated jeden Direktzugriff.
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Produktions-Backend: Postgres mit RLS; Abruf nur über get_report(token). */
export function createSupabaseStore(): Store {
  const sb = getClient()

  return {
    kind: 'supabase',

    async upsertCompanyByDomain(input, id) {
      const { data, error } = await sb
        .from('companies')
        .upsert(
          { ...(id ? { id } : {}), legal_name: input.legal_name, domain: input.domain, country_hq: input.country_hq, sector_nace: input.sector_nace ?? null },
          { onConflict: 'domain' },
        )
        .select()
        .single()
      if (error) throw error
      return data as Company
    },

    async createScan(input) {
      const { data, error } = await sb
        .from('scans')
        .insert({
          ...(input.id ? { id: input.id } : {}),
          company_id: input.company_id,
          mode: input.mode,
          status: 'queued',
          intake_json: input.intake_json,
          facts_json: {},
        })
        .select()
        .single()
      if (error) throw error
      return data as Scan
    },

    async getScan(id) {
      const { data, error } = await sb.from('scans').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return (data as Scan) ?? null
    },

    async updateScan(id, patch) {
      const { error } = await sb.from('scans').update(patch).eq('id', id)
      if (error) throw error
    },

    async insertFindings(scanId, findings) {
      await sb.from('findings').delete().eq('scan_id', scanId)
      const rows = findings.map((f) => ({
        scan_id: scanId,
        check_id: f.check_id,
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        fix: f.fix ?? null,
        control_refs: f.control_refs,
        evidence_json: f.evidence_json,
        source_url: f.source_url ?? null,
      }))
      if (rows.length) {
        const { error } = await sb.from('findings').insert(rows)
        if (error) throw error
      }
    },

    async getFindingsByScan(scanId) {
      const { data, error } = await sb.from('findings').select('*').eq('scan_id', scanId)
      if (error) throw error
      return (data ?? []) as FindingRow[]
    },

    async replaceAssessments(scanId, rows) {
      await sb.from('assessments').delete().eq('scan_id', scanId)
      const payload = rows.map((r) => ({
        scan_id: scanId,
        regime: r.regime,
        applicable: r.applicable,
        confidence: r.confidence,
        reasoning_md: r.reasoning_md,
        threshold_trace_json: r.threshold_trace_json,
        deadlines_json: r.deadlines_json,
        rules_version: r.rules_version,
      }))
      if (payload.length) {
        const { error } = await sb.from('assessments').insert(payload)
        if (error) throw error
      }
    },

    async getAssessmentsByScan(scanId) {
      const { data, error } = await sb.from('assessments').select('*').eq('scan_id', scanId)
      if (error) throw error
      return (data ?? []) as AssessmentRow[]
    },

    async setAssessmentOverride(id, patch) {
      const update: Record<string, unknown> = { override_at: new Date().toISOString() }
      if (patch.override_applicable !== undefined) update.override_applicable = patch.override_applicable
      if (patch.override_reasoning_md !== undefined) update.override_reasoning_md = patch.override_reasoning_md
      const { error } = await sb.from('assessments').update(update).eq('id', id)
      if (error) throw error
    },

    async createLead(input) {
      const { data, error } = await sb
        .from('leads')
        .insert({
          ...(input.id ? { id: input.id } : {}),
          company_id: input.company_id,
          email: input.email,
          consent_marketing: input.consent_marketing,
          report_token: input.report_token ?? randomUUID(),
        })
        .select()
        .single()
      if (error) throw error
      return data as Lead
    },

    async getLeadByToken(token) {
      const { data, error } = await sb.from('leads').select('*').eq('report_token', token).maybeSingle()
      if (error) throw error
      return (data as Lead) ?? null
    },

    async getLatestScanByCompany(companyId) {
      const { data, error } = await sb
        .from('scans')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as Scan) ?? null
    },

    async getReportByToken(token) {
      // Einziger Anon-Kapazitätspfad: security-definer-Funktion (0003_get_report.sql)
      const { data, error } = await sb.rpc('get_report', { p_token: token })
      if (error) throw error
      if (!data) return null
      const bundle = data as { company: Company; scan: Scan; findings: FindingRow[]; assessments: AssessmentRow[] }
      return bundle
    },

    async listScans() {
      const { data, error } = await sb
        .from('scans')
        .select('*, company:companies(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row: { company: Company; [k: string]: unknown }) => ({
        scan: Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'company')) as unknown as Scan,
        company: row.company,
      }))
    },

    async releaseScan(scanId) {
      const { error } = await sb
        .from('scans')
        .update({ review_status: 'released', released_at: new Date().toISOString() })
        .eq('id', scanId)
      if (error) throw error
    },

    async upsertRulesVersion(row, id) {
      const { error } = await sb.from('rules_versions').upsert(
        { ...(id ? { id } : {}), regime: row.regime, version_label: row.version_label, effective_from: row.effective_from, source_url: row.source_url, notes: row.notes ?? null },
        { onConflict: 'version_label' },
      )
      if (error) throw error
    },

    async listRulesVersions() {
      const { data, error } = await sb.from('rules_versions').select('*')
      if (error) throw error
      return (data ?? []) as RulesVersionRow[]
    },

    async joinWaitlist(input) {
      const normalizedEmail = input.email.trim().toLowerCase()
      const { data: existing } = await sb
        .from('waitlist')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle()
      if (existing) return { entry: existing as WaitlistEntry, duplicate: true }
      const { data, error } = await sb
        .from('waitlist')
        .insert({
          email: normalizedEmail,
          company_size: input.company_size,
          country: input.country,
          pain_note: input.pain_note?.trim() || null,
        })
        .select()
        .single()
      if (error) throw error
      return { entry: data as WaitlistEntry, duplicate: false }
    },
  }
}
