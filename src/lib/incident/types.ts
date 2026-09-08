import type { Applicable, ClockStage, DeadlineInfo, RegimeVerdict } from '@/lib/rules/types'
import type { Locale } from '@/i18n'
import type { IncidentIntake } from './schema'

/** Ampel-Status pro Regime – abgeleitet aus dem Rules-Engine-Urteil. */
export type TrafficLight = 'red' | 'amber' | 'green'

export interface AbsoluteDeadline {
  key: string
  hours: number
  label?: string
  /** ISO-Zeitpunkt: Kenntnisnahme + Stunden aus der Meldeuhr */
  due_at: string
}

export interface RegimeTriage {
  regime: string
  lawName: string
  applicable: Applicable
  trafficLight: TrafficLight
  confidence: number
  reasoningMd: string
  rulesVersionLabel: string
  effectiveFrom: string
  /** Relative Meldeuhr aus YAML */
  deadlines: DeadlineInfo
  /** Absolute Fristen ab discovered_at – nur bei relevantem Regime */
  absoluteDeadlines: AbsoluteDeadline[]
  authority: DeadlineInfo['authority']
}

export interface DraftNotification {
  locale: Locale
  subject: string
  body: string
  authorityName: string
  portalUrl: string
}

export interface ChecklistItem {
  id: string
  required: boolean
  /** i18n-Key unter incident.checklist.items.* oder fertiger Text */
  labelKey: string
  /** Optionaler Kontext (z. B. Regime-Code) */
  vars?: Record<string, string | number>
}

export interface IncidentTriageResult {
  regimes: RegimeTriage[]
  /** Roh-Urteile der Rules Engine (für Trace/Debug) */
  verdicts: RegimeVerdict[]
  draft: DraftNotification
  checklist: ChecklistItem[]
  /** Ampel-Zusammenfassung: schlechteste Ampel unter relevanten Regimes */
  overallTrafficLight: TrafficLight
}

export interface IncidentRecord {
  id: string
  token: string
  locale: Locale
  intake: IncidentIntake
  triage: IncidentTriageResult
  created_at: string
}

/** Mappt Rules-Engine-Applicable auf Ampelfarben (Handlungsdruck). */
export function trafficLightFor(applicable: Applicable): TrafficLight {
  switch (applicable) {
    case 'applicable':
      return 'red'
    case 'unclear':
      return 'amber'
    case 'not_applicable':
      return 'green'
  }
}

export function overallTrafficLight(lights: TrafficLight[]): TrafficLight {
  if (lights.includes('red')) return 'red'
  if (lights.includes('amber')) return 'amber'
  return 'green'
}

export function absoluteDeadlinesFrom(
  stages: ClockStage[],
  discoveredAtIso: string,
): AbsoluteDeadline[] {
  const base = new Date(discoveredAtIso).getTime()
  return stages.map((s) => ({
    key: s.key,
    hours: s.hours,
    label: s.label,
    due_at: new Date(base + s.hours * 3_600_000).toISOString(),
  }))
}
