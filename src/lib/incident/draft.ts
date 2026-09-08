import type { Locale } from '@/i18n'
import type { RegimeVerdict } from '@/lib/rules/types'
import type { IncidentIntake } from './schema'
import type { DraftNotification, RegimeTriage } from './types'

function fmtDateTime(iso: string, locale: Locale): string {
  const d = new Date(iso)
  const loc = locale === 'de' ? 'de-DE' : 'en-GB'
  return `${d.toLocaleDateString(loc)}, ${d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`
}

function availabilityLabel(v: IncidentIntake['service_availability'], locale: Locale): string {
  if (locale === 'de') {
    return { available: 'verfügbar', degraded: 'eingeschränkt', offline: 'nicht verfügbar' }[v]
  }
  return { available: 'available', degraded: 'degraded', offline: 'offline' }[v]
}

function personalDataLabel(v: IncidentIntake['personal_data'], locale: Locale): string {
  if (locale === 'de') {
    return { yes: 'ja', no: 'nein', unknown: 'unbekannt' }[v]
  }
  return { yes: 'yes', no: 'no', unknown: 'unknown' }[v]
}

function personsLabel(v: IncidentIntake['affected_persons'], locale: Locale): string {
  const de: Record<IncidentIntake['affected_persons'], string> = {
    none: 'keine',
    '1_99': '1–99',
    '100_999': '100–999',
    '1000_plus': '1.000+',
    unknown: 'unbekannt',
  }
  const en: Record<IncidentIntake['affected_persons'], string> = {
    none: 'none',
    '1_99': '1–99',
    '100_999': '100–999',
    '1000_plus': '1,000+',
    unknown: 'unknown',
  }
  return locale === 'de' ? de[v] : en[v]
}

/**
 * Entwurf einer Erstmeldung an die zuständige Meldestelle.
 * Bewusst knapp und faktenbasiert – keine Rechtsberatung.
 */
export function buildDraftNotification(
  intake: IncidentIntake,
  relevant: RegimeTriage[],
  locale: Locale,
): DraftNotification {
  const primary = relevant.find((r) => r.regime === intake.country_hq) ?? relevant[0]
  const authorityName = primary?.authority.name ?? (locale === 'de' ? 'zuständige Meldestelle' : 'competent authority')
  const portalUrl = primary?.authority.portal_url ?? ''
  const law = primary?.lawName ?? ''
  const regimesLine = relevant.map((r) => `${r.regime.toUpperCase()} (${r.lawName})`).join('; ')

  if (locale === 'de') {
    const subject = `Erstmeldung eines Sicherheitsvorfalls – ${intake.country_hq.toUpperCase()}`
    const body = [
      `Sehr geehrte Damen und Herren,`,
      ``,
      `hiermit übermitteln wir vorsorglich eine Erstmeldung zu einem Sicherheitsvorfall.`,
      ``,
      `Kurze Beschreibung: ${intake.description}`,
      `Zeitpunkt der Kenntnisnahme: ${fmtDateTime(intake.discovered_at, locale)}`,
      `Betroffene Systeme/Dienste: ${intake.systems_affected}`,
      `Verfügbarkeit der Dienste: ${availabilityLabel(intake.service_availability, locale)}`,
      `Personenbezogene Daten betroffen: ${personalDataLabel(intake.personal_data, locale)}`,
      `Geschätzte Anzahl betroffener Personen: ${personsLabel(intake.affected_persons, locale)}`,
      `Land der Hauptniederlassung: ${intake.country_hq.toUpperCase()}`,
      ``,
      `Relevante Meldepflichten (automatisierte Vorprüfung): ${regimesLine || 'noch offen'}`,
      law ? `Rechtsgrundlage der Vorprüfung: ${law}` : null,
      ``,
      `Weitere Angaben und eine Folgemeldung folgen, sobald die Sachlage geklärt ist.`,
      ``,
      `Hinweis: Dies ist ein automatisch erzeugter Entwurfstext und keine Rechtsberatung.`,
      ``,
      `Mit freundlichen Grüßen`,
    ]
      .filter((l) => l !== null)
      .join('\n')
    return { locale, subject, body, authorityName, portalUrl }
  }

  const subject = `Initial incident notification – ${intake.country_hq.toUpperCase()}`
  const body = [
    `Dear Sir or Madam,`,
    ``,
    `We hereby submit a precautionary initial notification of a security incident.`,
    ``,
    `Short description: ${intake.description}`,
    `Time of discovery: ${fmtDateTime(intake.discovered_at, locale)}`,
    `Systems/services affected: ${intake.systems_affected}`,
    `Service availability: ${availabilityLabel(intake.service_availability, locale)}`,
    `Personal data involved: ${personalDataLabel(intake.personal_data, locale)}`,
    `Estimated number of affected persons: ${personsLabel(intake.affected_persons, locale)}`,
    `Country of main establishment: ${intake.country_hq.toUpperCase()}`,
    ``,
    `Relevant reporting duties (automated pre-check): ${regimesLine || 'pending'}`,
    law ? `Legal basis of pre-check: ${law}` : null,
    ``,
    `Further details and a follow-up notification will follow once the facts are clarified.`,
    ``,
    `Note: This is an automatically generated draft and not legal advice.`,
    ``,
    `Yours sincerely`,
  ]
    .filter((l) => l !== null)
    .join('\n')
  return { locale, subject, body, authorityName, portalUrl }
}

/** Hilfsfunktion für Tests: Draft nur aus Intake + Verdicts. */
export function draftFromVerdicts(
  intake: IncidentIntake,
  verdicts: RegimeVerdict[],
  locale: Locale,
): DraftNotification {
  const relevant = verdicts
    .filter((v) => v.applicable !== 'not_applicable')
    .map((v) => ({
      regime: v.regime,
      lawName: v.lawName,
      applicable: v.applicable,
      trafficLight: 'amber' as const,
      confidence: v.confidence,
      reasoningMd: v.reasoningMd,
      rulesVersionLabel: v.rulesVersionLabel,
      effectiveFrom: v.effectiveFrom,
      unclearCode: v.unclearCode,
      deadlines: v.deadlines,
      absoluteDeadlines: [],
      authority: v.deadlines.authority,
      significanceNoteMd: v.significanceNoteMd,
      firedTriggers: [],
      incidentTriggers: v.incidentTriggers,
    }))
  return buildDraftNotification(intake, relevant, locale)
}
