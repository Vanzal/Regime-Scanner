import { z } from 'zod'

/**
 * Schema for rules/*.yaml — the single source of legal truth.
 * A condition is an AND-group of bounds; an entity class is an OR-group of
 * conditions. This mirrors the statutory structure ("mindestens X Mitarbeiter
 * ODER (Umsatz UND Bilanzsumme jeweils über Y)").
 */
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

export const RulesFileSchema = z.object({
  regime: z.string().regex(/^[a-z]{2}$/, 'regime muss ein ISO-2-Kürzel sein'),
  version: z.string().regex(/^v\d+$/),
  version_label: z.string().min(1),
  law_name: z.string().min(1),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_from als YYYY-MM-DD'),
  source_urls: z.array(z.string().url()).nonempty(),
  /** Land, in dem das Gesetz greift (Niederlassungs-Prinzip) */
  applicability_country: z.string().regex(/^[a-z]{2}$/),
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
      factors: z
        .array(
          z.object({
            id: z.string().min(1),
            label: z.string().min(1),
            note: z.string().optional(),
          }),
        )
        .nonempty(),
    })
    .optional(),
  penalties_note_md: z.string().optional(),
})

export type Bounds = z.infer<typeof BoundsSchema>
export type EntityClass = z.infer<typeof EntityClassSchema>
export type RulesFile = z.infer<typeof RulesFileSchema>
