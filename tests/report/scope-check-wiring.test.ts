import { describe, expect, it } from 'vitest'
import { parseScopeCheck } from '@/lib/report/data'
import { ScopeCheckResponseSchema } from '@/lib/scope-check/schema'

function payload(): Record<string, unknown> {
  return {
    regimes: [
      { name: 'Germany', status: 'possible', reasoning: 'r1' },
      { name: 'Austria', status: 'unlikely', reasoning: 'r2' },
      { name: 'Switzerland', status: 'likely', reasoning: 'r3' },
    ],
    summary: 's',
    key_gaps: ['g1', 'g2', 'g3', 'g4'],
    next_steps: ['n1', 'n2', 'n3'],
    disclaimer: 'd',
  }
}

describe('Scope-Check im Bericht (Wiring)', () => {
  it('gültiges scope_check_json → validiertes Ergebnis', () => {
    const parsed = parseScopeCheck(payload())
    expect(parsed).not.toBeNull()
    expect(parsed!.regimes).toHaveLength(3)
  })

  it('null / undefined → null (Abschnitt entfällt)', () => {
    expect(parseScopeCheck(null)).toBeNull()
    expect(parseScopeCheck(undefined)).toBeNull()
  })

  it('Schema-Verstoß (alter Stand in DB) → null statt harter Fehler', () => {
    const old = { regimes: [], summary: 'alt', disclaimer: 'x' }
    expect(ScopeCheckResponseSchema.safeParse(old).success).toBe(false)
    expect(parseScopeCheck(old as unknown as Record<string, unknown>)).toBeNull()
  })
})
