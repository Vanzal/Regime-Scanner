'use server'

import { redirect } from 'next/navigation'
import { IntakeSchema } from '@/lib/intake/schema'
import { getStore } from '@/lib/store'
import { scanModeForNewScan, runScan } from '@/lib/scan/pipeline'
import { triggerScan } from '@/lib/scan/trigger'
import { createLeadFor, sendReportEmail } from '@/lib/leads'

export interface IntakeState {
  ok: boolean
  errors?: Record<string, string>
  reportUrl?: string
  emailSent?: boolean
}

function formToRawIntake(fd: FormData): Record<string, unknown> {
  return {
    legal_name: fd.get('legal_name'),
    domain: fd.get('domain'),
    country_hq: fd.get('country_hq'),
    employees_band: fd.get('employees_band'),
    revenue_band: fd.get('revenue_band'),
    balance_band: fd.get('balance_band'),
    sector: fd.get('sector'),
    designated_critical: fd.get('designated_critical') === 'on',
    qualified_trust_service: fd.get('qualified_trust_service') === 'on',
    subsidiary_countries: fd.getAll('subsidiary_countries').filter((v) => typeof v === 'string'),
    supply_chain_critical: fd.get('supply_chain_critical') === 'on',
    eu_customers_security_clauses: fd.get('eu_customers_security_clauses'),
    email: fd.get('email'),
    consent_marketing: fd.get('consent_marketing') === 'on',
  }
}

/** Server Action unter dem Intake-Formular: validieren → Firma/Scan/Lead → Trigger. */
export async function submitIntake(_prev: IntakeState, fd: FormData): Promise<IntakeState> {
  const parsed = IntakeSchema.safeParse(formToRawIntake(fd))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }
  const intake = parsed.data

  const store = getStore()
  const company = await store.upsertCompanyByDomain({
    legal_name: intake.legal_name,
    domain: intake.domain,
    country_hq: intake.country_hq,
    sector_nace: intake.sector,
  })
  const scan = await store.createScan({
    company_id: company.id,
    mode: scanModeForNewScan(),
    intake_json: intake as unknown as Record<string, unknown>,
  })
  const lead = await createLeadFor(company.id, intake.email)

  triggerScan(scan.id)

  const base = process.env.SITE_URL ?? ''
  const reportUrl = `${base}/report/${lead.report_token}`

  // E-Mail ist Zustellungs-Verbesserung, kein Gate: ohne API-Key zeigt die
  // Folgeseite den Link direkt an.
  const emailSent = await sendReportEmail(intake.email, reportUrl, company.legal_name)

  redirect(`/scan/${scan.id}?t=${lead.report_token}&sent=${emailSent ? '1' : '0'}`)
}

/** Direkt laufender Rerun (Pilotmodus/„Erneut versuchen") – nur fürs Admin-Bereich. */
export async function rerunScan(scanId: string): Promise<void> {
  await runScan(scanId)
}
