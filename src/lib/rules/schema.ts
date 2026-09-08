import { z } from 'zod'

/**
 * Schema for rules/*.yaml — the single source of legal truth.
 * A condition is an AND-group of bounds; an entity class is an OR-group of
 * conditions. This mirrors the statutory structure ("mindestens X Mitarbeiter
 * ODER (Umsatz UND Bilanzsumme jeweils über Y)").
 *
 * engine_schema tracks the *engine* contract (not the legal version). Bump when
 * new YAML keys become required; old files without the field default to 1.
 */
export const ENGINE_SCHEMA_VERSION = 2

export const BoundsSchema = z
  .object({
    employees_min: z.number().int().nonnegative().optional(),
    revenue_eur_min: z.number().positive().optional(),
    balance_eur_min: z.number().positive().optional(),
    requires_critical_designation: z.literal(true).optional(),
    requires_qualified_trust_service: z.literal(true).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Bedingung braucht mindestens ein Merkmal' })

export const EntityClassSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    /** undefined = class applies regardless of sector */
    sectors: z.array(z.string()).nonempty().optional(),
    /** undefined = unconditional (sector match alone suffices) */
    conditions: z.array(BoundsSchema).optional(),
    outcome: z.enum(['applicable', 'unclear']).default('applicable'),
    note: z.string().optional(),
  })
  .refine((c) => c.sectors !== undefined || c.conditions !== undefined, {
    message: 'Klasse braucht sectors oder conditions',
  })

/**
 * Declarative factor matcher – new regimes add factors in YAML without touching
 * evaluate.ts. Unknown `kind` values fail schema validation at load time.
 * (z.union, not discriminatedUnion: subsidiary_in carries a .refine().)
 */
export const FactorWhenSchema = z.union([
  z
    .object({
      kind: z.literal('subsidiary_in'),
      /** `eu` = any EU-27 subsidiary; `countries` = explicit ISO-2 list */
      region: z.enum(['eu']).optional(),
      countries: z.array(z.string().regex(/^[a-z]{2}$/)).nonempty().optional(),
    })
    .refine((w) => w.region !== undefined || w.countries !== undefined, {
      message: 'subsidiary_in braucht region oder countries',
    }),
  z.object({
    kind: z.literal('fact_equals'),
    fact: z.enum([
      'euCustomersWithSecurityClauses',
      'supplyChainCritical',
      'designatedCritical',
      'qualifiedTrustService',
    ]),
    equals: z.union([z.string(), z.boolean()]),
    /** Values that mean „unknown“ rather than fail (default: unknown/null/undefined) */
    undetermined_when: z.array(z.union([z.string(), z.boolean(), z.null()])).optional(),
  }),
  z.object({
    kind: z.literal('fact_truthy'),
    fact: z.enum(['supplyChainCritical', 'designatedCritical', 'qualifiedTrustService']),
  }),
])

export const IndirectFactorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  note: z.string().optional(),
  /** Preferred: declarative matcher. Legacy id-based fallback remains in the engine. */
  when: FactorWhenSchema.optional(),
})

/**
 * Significance triggers for the Incident Copilot. Pure data on the rules file;
 * matching runs via `matchIncidentTriggers` against IncidentSignals.
 */
export const IncidentTriggerWhenSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('availability_in'),
    values: z.array(z.enum(['available', 'degraded', 'offline'])).nonempty(),
  }),
  z.object({
    kind: z.literal('personal_data_in'),
    values: z.array(z.enum(['yes', 'no', 'unknown'])).nonempty(),
  }),
  z.object({
    kind: z.literal('affected_persons_in'),
    values: z
      .array(z.enum(['none', '1_99', '100_999', '1000_plus', 'unknown']))
      .nonempty(),
  }),
  z.object({
    kind: z.literal('always'),
  }),
])

export const IncidentTriggerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  citation: z.string().min(1),
  severity_hint: z.enum(['info', 'low', 'med', 'high']).default('med'),
  /** reporting_clock.stages.key that this trigger starts (usually erstmeldung) */
  clock_stage: z.string().min(1).optional(),
  /** Free-form signal tags the Copilot can group on (e.g. availability_loss) */
  signals: z.array(z.string().min(1)).default([]),
  note: z.string().optional(),
  when: IncidentTriggerWhenSchema,
})

export const IncidentPolicySchema = z.object({
  significance_note_md: z.string().min(1),
  triggers: z.array(IncidentTriggerSchema).nonempty(),
})

export const RulesFileSchema = z.object({
  regime: z.string().regex(/^[a-z]{2}$/, 'regime muss ein ISO-2-Kürzel sein'),
  version: z.string().regex(/^v\d+$/),
  version_label: z.string().min(1),
  law_name: z.string().min(1),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_from als YYYY-MM-DD'),
  source_urls: z.array(z.string().url()).nonempty(),
  /**
   * Engine-contract version this file was authored against.
   * Defaults to 1 for legacy files; current authoring target is ENGINE_SCHEMA_VERSION.
   */
  engine_schema: z.number().int().positive().default(1),
  /** Land, in dem das Gesetz greift (Niederlassungs-Prinzip) */
  applicability_country: z.string().regex(/^[a-z]{2}$/),
  /** true = eine Tochtergesellschaft im Anwendungsland genügt für den örtlichen Anwendungsbereich (regimeabhängig) */
  establishment_via_subsidiary: z.boolean().optional(),
  entity_classes: z.array(EntityClassSchema).nonempty(),
  below_threshold: z
    .object({
      outcome: z.enum(['not_applicable', 'unclear']),
      note: z.string().min(1),
    })
    .optional(),
  reporting_clock: z.object({
    stages: z
      .array(
        z.object({
          key: z.string().min(1),
          hours: z.number().positive(),
          label: z.string().optional(),
        }),
      )
      .nonempty(),
    authority: z.object({
      name: z.string().min(1),
      portal_url: z.string().url(),
      format: z.string().optional(),
    }),
  }),
  /** Generic control id → juristische Zitierung im jeweiligen Gesetz */
  control_areas: z.record(z.string().min(1)),
  indirect_exposure: z
    .object({
      label: z.string().min(1),
      factors: z.array(IndirectFactorSchema).nonempty(),
    })
    .optional(),
  /** Significance criteria + triggers for Incident Copilot (optional for legacy) */
  incident_policy: IncidentPolicySchema.optional(),
  penalties_note_md: z.string().optional(),
})

export type Bounds = z.infer<typeof BoundsSchema>
export type EntityClass = z.infer<typeof EntityClassSchema>
export type FactorWhen = z.infer<typeof FactorWhenSchema>
export type IndirectFactor = z.infer<typeof IndirectFactorSchema>
export type IncidentTriggerWhen = z.infer<typeof IncidentTriggerWhenSchema>
export type IncidentTrigger = z.infer<typeof IncidentTriggerSchema>
export type IncidentPolicy = z.infer<typeof IncidentPolicySchema>
export type RulesFile = z.infer<typeof RulesFileSchema>
