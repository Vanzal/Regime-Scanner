// Shared types for the versioned rules engine. The engine is fully generic:
// every regime-specific fact lives in rules/*.yaml, never in code branches.

export type Applicable = 'applicable' | 'not_applicable' | 'unclear'

/**
 * Stable reason why a verdict stayed „unclear“. Machine-readable for the
 * Incident Copilot and for audits – never a free-text guess.
 */
export type UnclearCode =
  | 'missing_sector'
  | 'missing_size_inputs'
  | 'higher_class_undetermined'
  | 'classification_open'
  | 'indirect_exposure'
  | 'entity_class_outcome'

/** Size/money input as a known interval. `undefined` bounds mean "unknown". */
export interface SizeInterval {
  min?: number
  max?: number
}

export interface Subsidiary {
  name?: string
  /** ISO-3166 alpha-2, lowercase */
  country: string
}

export interface VerdictFacts {
  legalName?: string
  domain?: string
  /** ISO-3166 alpha-2, lowercase, or 'other' */
  countryHq?: string
  employees?: SizeInterval
  revenueEur?: SizeInterval
  balanceEur?: SizeInterval
  /** canonical sector key (see intake schema) or 'unknown' */
  sector?: string
  subsidiaries: Subsidiary[]
  /** Als kritische Infrastruktur bzw. kritische Anlage amtlich eingestuft */
  designatedCritical?: boolean
  /** eIDAS-qualifizierter Vertrauensdiensteanbieter */
  qualifiedTrustService?: boolean
  euCustomersWithSecurityClauses?: 'yes' | 'no' | 'unknown'
  supplyChainCritical?: boolean
}

/**
 * Signals from an Incident-Copilot intake. Kept separate from VerdictFacts so
 * entity-scope evaluation stays size/sector-based while significance matching
 * is driven by these fields against YAML `incident_policy.triggers`.
 */
export interface IncidentSignals {
  service_availability?: 'available' | 'degraded' | 'offline'
  personal_data?: 'yes' | 'no' | 'unknown'
  affected_persons?: 'none' | '1_99' | '100_999' | '1000_plus' | 'unknown'
}

export interface TraceEntry {
  kind: 'establishment' | 'sector' | 'class' | 'condition' | 'bound' | 'factor' | 'trigger'
  label: string
  status: 'pass' | 'fail' | 'undetermined' | 'skipped' | 'fired'
  detail?: string
  /** Stable machine code, e.g. `bound.employees_min`, `class.besonders_sonstige_anlage1` */
  code?: string
  /** Entity-class id when the step belongs to a class */
  class_id?: string
  /** Canonical input key that left the step undetermined */
  input_key?: string
}

export interface MissingInput {
  /** Canonical key: employees | revenue_eur | balance_eur | sector | … */
  key: string
  /** Human label (German, from the rule evaluation) */
  label: string
}

export interface ThresholdTrace {
  entries: TraceEntry[]
  /** @deprecated Prefer `missing` – kept for stored assessments / UI compat */
  missing_inputs: string[]
  /** Structured open inputs for Copilot / follow-up forms */
  missing?: MissingInput[]
  /** One-line path summary, e.g. "establishment→sector→class:wichtig_…" */
  summary?: string
  /** Matched entity-class id, if any */
  matched_class_id?: string | null
  /** Why the verdict is unclear (absent when decisive) */
  unclear_code?: UnclearCode
  /** Rules version_label echoed into the trace for explainability */
  rules_version?: string
  /** Engine schema the file targeted */
  engine_schema?: number
}

export interface ClockStage {
  key: string
  hours: number
  /** Gesetzesnahe Beschriftung aus der Regeldatei */
  label?: string
}

export interface DeadlineInfo {
  stages: ClockStage[]
  authority: { name: string; portal_url: string; format?: string }
}

/** One YAML-declared significance trigger, ready for Copilot consumption. */
export interface IncidentTriggerInfo {
  id: string
  label: string
  citation: string
  severity_hint: 'info' | 'low' | 'med' | 'high'
  clock_stage?: string
  signals: string[]
  note?: string
}

export interface IncidentTriggerMatch extends IncidentTriggerInfo {
  status: 'fired' | 'fail' | 'undetermined'
  detail: string
}

export interface RegimeVerdict {
  /** ISO-2 regime code from the rules file */
  regime: string
  lawName: string
  applicable: Applicable
  confidence: number
  reasoningMd: string
  thresholdTrace: ThresholdTrace
  deadlines: DeadlineInfo
  rulesVersionLabel: string
  effectiveFrom: string
  /** Why unclear – mirrors thresholdTrace.unclear_code */
  unclearCode?: UnclearCode
  /** Winning entity-class id when applicable/unclear-by-class */
  matchedClassId?: string | null
  /** Engine schema version the YAML declared (default 1) */
  engineSchema: number
  /** Regime significance note (markdown) from incident_policy */
  significanceNoteMd?: string
  /** All triggers declared for this regime (explainable catalogue) */
  incidentTriggers: IncidentTriggerInfo[]
}
