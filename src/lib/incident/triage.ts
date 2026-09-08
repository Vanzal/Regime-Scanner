import type { Locale } from '@/i18n'
import { loadRules } from '@/lib/rules/loader'
import { evaluateAll } from '@/lib/rules/evaluate'
import { buildChecklist } from './checklist'
import { buildDraftNotification } from './draft'
import { buildFactsFromIncident } from './facts'
import type { IncidentIntake } from './schema'
import {
  absoluteDeadlinesFrom,
  overallTrafficLight,
  trafficLightFor,
  type IncidentTriageResult,
  type RegimeTriage,
} from './types'

/**
 * Incident-Triage: Rules Engine unverändert wiederverwenden.
 * Ampel + absolute Fristen + Entwurfstext + Checkliste drumherum.
 */
export function runIncidentTriage(
  intake: IncidentIntake,
  locale: Locale,
): IncidentTriageResult {
  const rules = loadRules()
  const facts = buildFactsFromIncident(intake)
  const verdicts = evaluateAll(rules, facts)

  const regimes: RegimeTriage[] = verdicts.map((v) => {
    const light = trafficLightFor(v.applicable)
    const relevant = v.applicable !== 'not_applicable'
    return {
      regime: v.regime,
      lawName: v.lawName,
      applicable: v.applicable,
      trafficLight: light,
      confidence: v.confidence,
      reasoningMd: v.reasoningMd,
      rulesVersionLabel: v.rulesVersionLabel,
      effectiveFrom: v.effectiveFrom,
      deadlines: v.deadlines,
      absoluteDeadlines: relevant
        ? absoluteDeadlinesFrom(v.deadlines.stages, intake.discovered_at)
        : [],
      authority: v.deadlines.authority,
    }
  })

  const relevant = regimes.filter((r) => r.applicable !== 'not_applicable')
  const draft = buildDraftNotification(intake, relevant, locale)
  const checklist = buildChecklist(intake, relevant)

  return {
    regimes,
    verdicts,
    draft,
    checklist,
    overallTrafficLight: overallTrafficLight(regimes.map((r) => r.trafficLight)),
  }
}
