import fs from 'node:fs'
import path from 'node:path'
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
import type { SubscriptionRecord, UpsertSubscriptionInput } from '@/lib/billing/types'

interface FileDb {
  companies: Company[]
  scans: Scan[]
  findings: FindingRow[]
  assessments: AssessmentRow[]
  leads: Lead[]
  rules_versions: RulesVersionRow[]
  waitlist: WaitlistEntry[]
  subscriptions: SubscriptionRecord[]
}

const EMPTY_DB: FileDb = {
  companies: [],
  scans: [],
  findings: [],
  assessments: [],
  leads: [],
  rules_versions: [],
  waitlist: [],
  subscriptions: [],
}

function resolveDbPath(): string {
  return process.env.LOCAL_DB_PATH ?? path.join(process.cwd(), '.data', 'db.json')
}

function readDb(): FileDb {
  const p = resolveDbPath()
  if (!fs.existsSync(p)) return structuredClone(EMPTY_DB)
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8')) as Partial<FileDb>
    return { ...structuredClone(EMPTY_DB), ...parsed }
  } catch {
    return structuredClone(EMPTY_DB)
  }
}

function writeDb(db: FileDb): void {
  const p = resolveDbPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, p)
}

function now(): string {
  return new Date().toISOString()
}

/**
 * Lokales Backend ohne externe Abhängigkeiten – Demo/Pilot ohne Supabase-Projekt.
 * Nur serverseitig einsetzbar (Dateisystem); gleiche Semantik wie der
 * Supabase-Store inkl. „nur freigegebene Scans sind abrufbar“.
 */
export function createFileStore(): Store {
  return {
    kind: 'file',

    async upsertCompanyByDomain(input, id) {
      const db = readDb()
      const existing = db.companies.find((c) => c.domain === input.domain)
      if (existing) {
        existing.legal_name = input.legal_name
        existing.country_hq = input.country_hq
        if (input.sector_nace) existing.sector_nace = input.sector_nace
        writeDb(db)
        return existing
      }
      const company: Company = {
        id: id ?? randomUUID(),
        legal_name: input.legal_name,
        domain: input.domain,
        country_hq: input.country_hq,
        sector_nace: input.sector_nace ?? null,
        created_at: now(),
      }
      db.companies.push(company)
      writeDb(db)
      return company
    },

    async createScan(input) {
      const db = readDb()
      const scan: Scan = {
        id: input.id ?? randomUUID(),
        company_id: input.company_id,
        status: 'queued',
        mode: input.mode,
        started_at: null,
        finished_at: null,
        driver_used: null,
        review_status: 'pending_review',
        released_at: null,
        intake_json: input.intake_json,
        facts_json: {},
        error: null,
        created_at: now(),
      }
      db.scans.push(scan)
      writeDb(db)
      return scan
    },

    async getScan(id) {
      const db = readDb()
      return db.scans.find((s) => s.id === id) ?? null
    },

    async updateScan(id, patch) {
      const db = readDb()
      const scan = db.scans.find((s) => s.id === id)
      if (!scan) throw new Error(`Scan ${id} nicht gefunden`)
      Object.assign(scan, patch)
      writeDb(db)
    },

    async insertFindings(scanId, findings) {
      const db = readDb()
      db.findings = db.findings.filter((f) => f.scan_id !== scanId)
      for (const f of findings) {
        db.findings.push({ id: randomUUID(), scan_id: scanId, ...f, source_url: f.source_url ?? null })
      }
      writeDb(db)
    },

    async getFindingsByScan(scanId) {
      const db = readDb()
      return db.findings.filter((f) => f.scan_id === scanId)
    },

    async replaceAssessments(scanId, rows) {
      const db = readDb()
      db.assessments = db.assessments.filter((a) => a.scan_id !== scanId)
      for (const row of rows) {
        db.assessments.push({ id: randomUUID(), scan_id: scanId, override_applicable: null, override_reasoning_md: null, override_at: null, ...row })
      }
      writeDb(db)
    },

    async getAssessmentsByScan(scanId) {
      const db = readDb()
      return db.assessments.filter((a) => a.scan_id === scanId)
    },

    async setAssessmentOverride(id, patch) {
      const db = readDb()
      const row = db.assessments.find((a) => a.id === id)
      if (!row) throw new Error(`Assessment ${id} nicht gefunden`)
      if (patch.override_applicable !== undefined) row.override_applicable = patch.override_applicable
      if (patch.override_reasoning_md !== undefined) row.override_reasoning_md = patch.override_reasoning_md
      row.override_at = now()
      writeDb(db)
    },

    async createLead(input) {
      const db = readDb()
      const lead: Lead = {
        id: input.id ?? randomUUID(),
        company_id: input.company_id,
        email: input.email,
        consent_marketing: input.consent_marketing,
        report_token: input.report_token,
        created_at: now(),
      }
      db.leads.push(lead)
      writeDb(db)
      return lead
    },

    async getLeadByToken(token) {
      const db = readDb()
      return db.leads.find((l) => l.report_token === token) ?? null
    },

    async getLatestScanByCompany(companyId) {
      const db = readDb()
      return (
        db.scans
          .filter((s) => s.company_id === companyId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
      )
    },

    async getReportByToken(token) {
      const db = readDb()
      const lead = db.leads.find((l) => l.report_token === token)
      if (!lead) return null
      const company = db.companies.find((c) => c.id === lead.company_id)
      if (!company) return null
      const scan = db.scans
        .filter((s) => s.company_id === company.id && s.review_status === 'released' && s.status === 'done')
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      if (!scan) return null
      const findings = db.findings.filter((f) => f.scan_id === scan.id)
      const assessments = db.assessments.filter((a) => a.scan_id === scan.id)
      return { company, scan, findings, assessments }
    },

    async listScans() {
      const db = readDb()
      return db.scans
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((scan) => {
          const company = db.companies.find((c) => c.id === scan.company_id)
          return company ? { scan, company } : null
        })
        .filter((x): x is { scan: Scan; company: Company } => x !== null)
    },

    async releaseScan(scanId) {
      const db = readDb()
      const scan = db.scans.find((s) => s.id === scanId)
      if (!scan) throw new Error(`Scan ${scanId} nicht gefunden`)
      scan.review_status = 'released'
      scan.released_at = now()
      writeDb(db)
    },

    async upsertRulesVersion(row, id) {
      const db = readDb()
      const existing = db.rules_versions.find((r) => r.version_label === row.version_label)
      if (existing) {
        Object.assign(existing, row)
      } else {
        db.rules_versions.push({ id: id ?? randomUUID(), ...row })
      }
      writeDb(db)
    },

    async listRulesVersions() {
      const db = readDb()
      return db.rules_versions
    },

    async joinWaitlist(input) {
      const db = readDb()
      const normalizedEmail = input.email.trim().toLowerCase()
      const existing = db.waitlist.find((w) => w.email === normalizedEmail)
      if (existing) return { entry: existing, duplicate: true }
      const entry: WaitlistEntry = {
        id: randomUUID(),
        email: normalizedEmail,
        company_size: input.company_size,
        country: input.country,
        pain_note: input.pain_note?.trim() || null,
        created_at: now(),
      }
      db.waitlist.push(entry)
      writeDb(db)
      return { entry, duplicate: false }
    },

    async upsertSubscription(input: UpsertSubscriptionInput) {
      const db = readDb()
      const email = input.email.trim().toLowerCase()
      const stamp = now()
      const existing = db.subscriptions.find(
        (s) => s.stripe_subscription_id === input.stripe_subscription_id,
      )
      if (existing) {
        existing.email = email
        existing.stripe_customer_id = input.stripe_customer_id
        existing.stripe_price_id = input.stripe_price_id ?? existing.stripe_price_id
        existing.status = input.status
        existing.current_period_end =
          input.current_period_end === undefined
            ? existing.current_period_end
            : input.current_period_end
        existing.cancel_at_period_end =
          input.cancel_at_period_end ?? existing.cancel_at_period_end
        existing.updated_at = stamp
        writeDb(db)
        return existing
      }
      const row: SubscriptionRecord = {
        id: randomUUID(),
        email,
        stripe_customer_id: input.stripe_customer_id,
        stripe_subscription_id: input.stripe_subscription_id,
        stripe_price_id: input.stripe_price_id ?? null,
        status: input.status,
        current_period_end: input.current_period_end ?? null,
        cancel_at_period_end: input.cancel_at_period_end ?? false,
        created_at: stamp,
        updated_at: stamp,
      }
      db.subscriptions.push(row)
      writeDb(db)
      return row
    },

    async getSubscriptionByEmail(email) {
      const normalized = email.trim().toLowerCase()
      const rows = readDb().subscriptions.filter((s) => s.email === normalized)
      const active = rows.find((s) =>
        ['active', 'trialing', 'past_due'].includes(s.status),
      )
      return active ?? rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null
    },

    async getSubscriptionByStripeId(stripeSubscriptionId) {
      return (
        readDb().subscriptions.find((s) => s.stripe_subscription_id === stripeSubscriptionId) ??
        null
      )
    },
  }
}
