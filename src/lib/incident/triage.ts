import type { Locale } from '@/i18n'
import { loadRules } from '@/lib/rules/loader'
import { evaluateAllWithIncidentSignals } from '@/lib/rules/evaluate'
import { buildChecklist } from './checklist'
import { buildDraftNotification } from './draft'
import { buildFactsFromIncident, buildSignalsFromIncident } from './facts'
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
 * Signifikanz-Trigger kommen aus YAML `incident_policy` (versioniert).
 */
export function runIncidentTriage(
  intake: IncidentIntake,
  locale: Locale,
): IncidentTriageResult {
  const rules = loadRules()
  const facts = buildFactsFromIncident(intake)
  const signals = buildSignalsFromIncident(intake)
  const verdicts = evaluateAllWithIncidentSignals(rules, facts, signals)

  const regimes: RegimeTriage[] = verdicts.map((v) => {
    const light = trafficLightFor(v.applicable)
    const relevant = v.applicable !== 'not_applicable'
    const firedTriggers = v.thresholdTrace.entries
      .filter((e) => e.kind === 'trigger' && e.status === 'fired')
      .map((e) => ({
        id: (e.code ?? '').replace(/^trigger\./, '') || e.label,
        label: e.label,
        citation: e.detail?.split(' · ')[0] ?? '',
        detail: e.detail,
      }))
    return {
      regime: v.regime,
      lawName: v.lawName,
      applicable: v.applicable,
      trafficLight: light,
      confidence: v.confidence,
      reasoningMd: v.reasoningMd,
      rulesVersionLabel: v.rulesVersionLabel,
      effectiveFrom: v.effectiveFrom,
      unclearCode: v.unclearCode,
      deadlines: v.deadlines,
      absoluteDeadlines: relevant
        ? absoluteDeadlinesFrom(v.deadlines.stages, intake.discovered_at)
        : [],
      authority: v.deadlines.authority,
      significanceNoteMd: v.significanceNoteMd,
      firedTriggers,
      incidentTriggers: v.incidentTriggers,
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
