import { z } from 'zod'

/**
 * Antwort-Schema des Scope-Checks. Spiegelt das im System-Prompt versprochene
 * JSON – inklusive fester Regime-Reihenfolge (Germany, Austria, Switzerland)
 * und Pflicht-Disclaimer. Das Rendering kann sich darauf verlassen.
 */
export const ScopeStatusSchema = z.enum(['likely', 'possible', 'unlikely'])

const RegimeAssessmentSchema = z.object({
  name: z.string().min(1),
  status: ScopeStatusSchema,
  reasoning: z.string().min(1),
})

export const ScopeCheckResponseSchema = z
  .object({
    regimes: z.tuple([RegimeAssessmentSchema, RegimeAssessmentSchema, RegimeAssessmentSchema]),
    summary: z.string().min(1),
    key_gaps: z.array(z.string().min(1)).min(4).max(6),
    next_steps: z.array(z.string().min(1)).min(3).max(5),
    disclaimer: z.string().min(1),
  })
  .refine(
    (r) =>
      r.regimes[0].name === 'Germany' && r.regimes[1].name === 'Austria' && r.regimes[2].name === 'Switzerland',
    { message: 'regimes muss genau 3 Einträge in dieser Reihenfolge enthalten: Germany, Austria, Switzerland' },
  )

export type ScopeStatus = z.infer<typeof ScopeStatusSchema>
export type ScopeCheckResult = z.infer<typeof ScopeCheckResponseSchema>
