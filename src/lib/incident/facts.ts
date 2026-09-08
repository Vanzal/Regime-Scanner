import type { IncidentSignals, VerdictFacts } from '@/lib/rules/types'
import type { IncidentIntake } from './schema'

/**
 * Incident-Intake → minimale VerdictFacts für die Rules Engine.
 * Nur der Hauptsitz ist bekannt; Schwellen/Branche bleiben offen →
 * das Heimat-Regime wird ehrlich als „unclear“ (unclearCode: missing_sector)
 * bewertet, solange keine vollständige Free-Scan-Intake vorliegt. Fristen
 * kommen trotzdem aus der YAML-Meldeuhr (relevant = nicht not_applicable).
 */
export function buildFactsFromIncident(intake: IncidentIntake): VerdictFacts {
  return {
    countryHq: intake.country_hq,
    sector: 'unknown',
    subsidiaries: [],
    // Incident-Formular erhebt keine Indirekt-Faktoren → nicht als „offen“
    // in die CH-Indirekt-Prüfung einfließen lassen (sonst immer amber).
    euCustomersWithSecurityClauses: 'no',
    supplyChainCritical: false,
  }
}

/** Intake → Signale für YAML `incident_policy.triggers`. */
export function buildSignalsFromIncident(intake: IncidentIntake): IncidentSignals {
  return {
    service_availability: intake.service_availability,
    personal_data: intake.personal_data,
    affected_persons: intake.affected_persons,
  }
}
