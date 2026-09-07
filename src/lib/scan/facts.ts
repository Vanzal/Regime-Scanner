import type { IntakeAnswers } from '@/lib/intake/schema'
import type { SizeInterval, VerdictFacts } from '@/lib/rules/types'

/**
 * Band-Angaben → Intervalle. Kanten so gezogen, dass "über"-Schranken (>)
 * bzw. "mindestens"-Schranken (≥) aus den Bändern sicher auswertbar sind:
 * ein Band bestätigt eine Schranke nur, wenn jedes Mitglied des Bandes sie
 * erfüllt, und widerlegt sie nur, wenn keines sie erfüllt – sonst bleibt
 * die Bewertung offen (die Engine errät nichts).
 */
export function employeesInterval(band: IntakeAnswers['employees_band']): SizeInterval | undefined {
  switch (band) {
    case 'lt_50': return { max: 49 }
    case '50_249': return { min: 50, max: 249 }
    case '250_plus': return { min: 250 }
    default: return undefined
  }
}

export function revenueInterval(band: IntakeAnswers['revenue_band']): SizeInterval | undefined {
  switch (band) {
    case 'lt_10m': return { max: 9_999_999 }
    case '10_50m': return { min: 10_000_001, max: 50_000_000 }
    case 'gt_50m': return { min: 50_000_001 }
    default: return undefined
  }
}

export function balanceInterval(band: IntakeAnswers['balance_band']): SizeInterval | undefined {
  switch (band) {
    case 'lt_10m': return { max: 9_999_999 }
    case '10_43m': return { min: 10_000_001, max: 43_000_000 }
    case 'gt_43m': return { min: 43_000_001 }
    default: return undefined
  }
}

/** Intake-Antworten sind die Basis-Fakten; die Sammlung kann sie verfeinern. */
export function buildFactsFromIntake(intake: IntakeAnswers): VerdictFacts {
  return {
    legalName: intake.legal_name,
    domain: intake.domain,
    countryHq: intake.country_hq === 'unknown' ? undefined : intake.country_hq,
    employees: employeesInterval(intake.employees_band),
    revenueEur: revenueInterval(intake.revenue_band),
    balanceEur: balanceInterval(intake.balance_band),
    sector: intake.sector,
    subsidiaries: intake.subsidiary_countries
      .filter((c): c is Exclude<typeof c, 'other'> => c !== 'other')
      .map((country) => ({ country })),
    designatedCritical: intake.designated_critical,
    qualifiedTrustService: intake.qualified_trust_service ? true : undefined,
    euCustomersWithSecurityClauses: intake.eu_customers_security_clauses,
    supplyChainCritical: intake.supply_chain_critical,
  }
}
