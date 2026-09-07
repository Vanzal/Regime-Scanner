// Shared types for the versioned rules engine. The engine is fully generic:
// every regime-specific fact lives in rules/*.yaml, never in code branches.

export type Applicable = 'applicable' | 'not_applicable' | 'unclear'

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

export interface TraceEntry {
  kind: 'establishment' | 'sector' | 'class' | 'condition' | 'bound' | 'factor'
  label: string
  status: 'pass' | 'fail' | 'undetermined' | 'skipped' | 'fired'
  detail?: string
}

export interface ThresholdTrace {
  entries: TraceEntry[]
  /** human names of the inputs that prevented a decisive verdict */
  missing_inputs: string[]
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
}
