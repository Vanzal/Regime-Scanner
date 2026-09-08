import { getStore } from '@/lib/store'
import type { Lead } from '@/lib/store/types'

/** Bericht-Link erzeugen und (wenn konfiguriert) per E-Mail zustellen. */
export async function createLeadFor(companyId: string, email: string): Promise<Lead> {
  const lead = await getStore().createLead({
    company_id: companyId,
    email,
    consent_marketing: true,
    report_token: crypto.randomUUID(),
  })
  return lead
}

/**
 * Deutsche Benachrichtigungs-E-Mail (Plain-Fetch zu Resend; ohne API-Key eine
 * No-Op-Return – der Link erscheint on-screen, das Gate hängt nicht daran).
 */
export async function sendReportEmail(email: string, reportUrl: string, companyName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const text = [
    `Guten Tag,`,
    ``,
    `Ihr NexusScope-Bericht für ${companyName} ist fertig:`,
    reportUrl,
    ``,
    `Der Bericht nennt, welche Cyber-Meldepflichten für Ihr Unternehmen gelten`,
    `(NIS2UmsuCG/BSIG, NISG 2024, ISG), welche Meldefristen im Ernstfall laufen und`,
    `welche öffentlich sichtbaren Sicherheitslücken wir gefunden haben.`,
    ``,
    `Hinweis: automatisierte erste Orientierung aus öffentlichen Quellen – keine Rechtsberatung.`,
    ``,
    `Ihr NexusScope-Team`,
  ].join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'NexusScope <berichte@nexusscope.example>',
        to: [email],
        subject: 'Ihr Bericht: Welche Meldepflichten gelten für Sie?',
        text,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
