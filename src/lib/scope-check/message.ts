import type { IntakeAnswers } from '@/lib/intake/schema'
import { SECTOR_KEYS } from '@/lib/intake/schema'

/**
 * Baut die eine User-Message für den Scope-Check aus den Intake-Antworten.
 * Das Format entspricht dem im System-Prompt erwarteten Plain-Text-Layout.
 *
 * Abbildungs-Entscheidungen (Intake reicher als das 7-Felder-Formular):
 * - EU-Exposure wird aus EU-Kunden-Klauseln UND EU-Tochterländern abgeleitet;
 *   „other“-Tochter bleibt offen (könnte EU sein) → „Unknown“.
 * - ISO-Zertifikat ist im Intake optional → „not captured“, nie geraten.
 */

const SECTOR_LABELS: Record<(typeof SECTOR_KEYS)[number], string> = {
  energie: 'Energy',
  verkehr: 'Transport',
  banken: 'Banking',
  finanzmarktinfrastruktur: 'Financial market infrastructure',
  gesundheit: 'Health',
  trinkwasser: 'Drinking water',
  abwasser: 'Waste water',
  digital_infrastruktur: 'Digital infrastructure',
  weltraum: 'Space',
  post: 'Postal/courier',
  abfallwirtschaft: 'Waste management',
  chemie: 'Chemicals',
  lebensmittel: 'Food',
  verarbeitendes_gewerbe: 'Manufacturing',
  digitale_dienste: 'Digital services',
  it_dienst: 'ICT service management (B2B)',
  forschung: 'Research',
  oeffentliche_verwaltung: 'Public administration',
  telekommunikation: 'Telecommunications',
  vertrauensdiensteanbieter: 'Trust service provider',
  dns_diensteanbieter: 'DNS service provider',
  tld_registry: 'TLD registry',
  sonstige: 'Other',
}

const COUNTRY_LABELS: Record<string, string> = { de: 'Germany', at: 'Austria', ch: 'Switzerland' }

const EMPLOYEE_LABELS: Record<IntakeAnswers['employees_band'], string> = {
  lt_50: 'under 50',
  '50_249': '50-249',
  '250_plus': '250 or more',
  unknown: 'unknown',
}

const REVENUE_LABELS: Record<IntakeAnswers['revenue_band'], string> = {
  lt_10m: 'under EUR 10M',
  '10_50m': 'EUR 10M-50M',
  gt_50m: 'over EUR 50M',
  unknown: 'unknown',
}

/** ISO-2 EU-Mitglieder, die das Intake als Tochterland kennen kann. CH bewusst NICHT dabei. */
const EU_SUBSIDIARY_COUNTRIES = ['de', 'at', 'fr', 'it', 'nl', 'pl', 'cz']

export function countryOfOperation(countryHq: IntakeAnswers['country_hq']): string {
  return COUNTRY_LABELS[countryHq] ?? 'Other/multiple'
}

/**
 * Ja/Nein/Unbekannt zur Frage „EU-Töchter oder EU/DE/AT-Kunden mit
 * vertraglichen Sicherheitsanforderungen“. `unknown` bleibt unknown –
 * die Engine rät nicht, auch hier nicht.
 */
export function euExposure(intake: IntakeAnswers): 'Yes' | 'No' | 'Unknown' {
  const hasEuSubsidiary = intake.subsidiary_countries.some((c) => EU_SUBSIDIARY_COUNTRIES.includes(c))
  if (intake.eu_customers_security_clauses === 'yes' || hasEuSubsidiary) return 'Yes'
  const maybeEu = intake.subsidiary_countries.includes('other')
  if (intake.eu_customers_security_clauses === 'no' && !maybeEu) return 'No'
  return 'Unknown'
}

export function buildScopeCheckUserMessage(intake: IntakeAnswers): string {
  const sectorLabel = SECTOR_LABELS[intake.sector]
  const isoLine =
    intake.iso27001_certified === 'yes'
      ? 'Yes'
      : intake.iso27001_certified === 'no'
        ? 'No'
        : 'Not captured in this intake'
  return [
    `Company sector: ${sectorLabel}`,
    `Primary country of operation: ${countryOfOperation(intake.country_hq)}`,
    `Employee count: ${EMPLOYEE_LABELS[intake.employees_band]}`,
    `Approximate annual revenue: ${REVENUE_LABELS[intake.revenue_band]}`,
    `Has EU subsidiaries or EU/DE/AT customers requiring contractual security compliance: ${euExposure(intake)}`,
    `Already holds ISO 27001 or a similar certification: ${isoLine}`,
    `Brief description: ${intake.legal_name} (website: ${intake.domain})`,
  ].join('\n')
}
