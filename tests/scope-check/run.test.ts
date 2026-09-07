import { describe, expect, it, vi } from 'vitest'
import {
  SCOPE_CHECK_MAX_TOKENS,
  SCOPE_CHECK_MODEL,
  ScopeCheckParseError,
  ScopeCheckTruncatedError,
  extractJsonObject,
  runScopeCheck,
  type ScopeCheckClient,
} from '@/lib/scope-check/run'
import type { IntakeAnswers } from '@/lib/intake/schema'

function intake(): IntakeAnswers {
  return {
    legal_name: 'Muster AG',
    domain: 'muster.ch',
    country_hq: 'ch',
    employees_band: '50_249',
    revenue_band: '10_50m',
    balance_band: '10_43m',
    sector: 'energie',
    designated_critical: false,
    qualified_trust_service: false,
    subsidiary_countries: [],
    supply_chain_critical: false,
    eu_customers_security_clauses: 'no',
    email: 'ops@muster.ch',
    consent_marketing: true,
  }
}

function validPayload(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    regimes: [
      { name: 'Germany', status: 'possible', reasoning: 'Mittelstand, Fertigung – Schwellenwerte offen.' },
      { name: 'Austria', status: 'unlikely', reasoning: 'Keine AT-Niederlassung bekannt.' },
      { name: 'Switzerland', status: 'likely', reasoning: 'Energiesektor in der Schweiz.' },
    ],
    summary: 'Richtungsscan, keine Rechtsberatung.',
    key_gaps: ['g1', 'g2', 'g3', 'g4'],
    next_steps: ['n1', 'n2', 'n3'],
    disclaimer: 'Directional scan, not legal advice.',
    ...over,
  }
}

function stubClient(text: string, stopReason: string | null = 'end_turn'): ScopeCheckClient {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        stop_reason: stopReason,
        content: [{ type: 'text', text }],
      }),
    },
  } as unknown as ScopeCheckClient
}

const json = (payload: Record<string, unknown>) => JSON.stringify(payload)

describe('extractJsonObject', () => {
  it('nimmt nacktes JSON', () => {
    expect(extractJsonObject(json(validPayload()))).toEqual(validPayload())
  })

  it('toleriert Codefences und Preamble', () => {
    const raw = `Hier ist die Analyse:\n\`\`\`json\n${json(validPayload())}\n\`\`\``
    expect(extractJsonObject(raw)).toEqual(validPayload())
  })

  it('wirft bei leerer Antwort', () => {
    expect(() => extractJsonObject('Kein JSON hier.')).toThrow(ScopeCheckParseError)
  })
})

describe('runScopeCheck', () => {
  it('ruft das Briefing-Modell mit 1000 Tokens und genau einer User-Message auf und validiert das JSON', async () => {
    const client = stubClient(json(validPayload()))
    const result = await runScopeCheck(intake(), { anthropic: client })
    expect(result.regimes.map((r) => r.name)).toEqual(['Germany', 'Austria', 'Switzerland'])
    expect(result.disclaimer).toContain('not legal advice')
    expect(client.messages.create).toHaveBeenCalledTimes(1)
    const arg = (client.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(arg.model).toBe(SCOPE_CHECK_MODEL)
    expect(SCOPE_CHECK_MODEL).toBe('claude-sonnet-4-6')
    expect(arg.max_tokens).toBe(SCOPE_CHECK_MAX_TOKENS)
    expect(arg.messages).toHaveLength(1)
    expect(arg.messages[0].role).toBe('user')
    expect(arg.messages[0].content).toContain('Company sector: Energy')
    expect(arg.system[0].text).toContain('regulatory-scoping assistant')
  })

  it('Truncation → typisierter Fehler, kein Halbergebnis', async () => {
    const client = stubClient(json(validPayload()).slice(0, 40), 'max_tokens')
    await expect(runScopeCheck(intake(), { anthropic: client })).rejects.toBeInstanceOf(ScopeCheckTruncatedError)
  })

  it('Schema-Verstoß (falsche Regime-Reihenfolge) → Parse-Fehler', async () => {
    const wrong = validPayload({
      regimes: [
        { name: 'Austria', status: 'likely', reasoning: 'x' },
        { name: 'Germany', status: 'possible', reasoning: 'y' },
        { name: 'Switzerland', status: 'unlikely', reasoning: 'z' },
      ],
    })
    await expect(runScopeCheck(intake(), { anthropic: stubClient(json(wrong)) })).rejects.toBeInstanceOf(
      ScopeCheckParseError,
    )
  })

  it('Schema-Verstoß (zu wenige Gaps / 2 Regimes) → Parse-Fehler', async () => {
    const two = validPayload({
      regimes: (validPayload().regimes as Array<Record<string, unknown>>).slice(0, 2),
      key_gaps: ['nur', 'zwei'],
    })
    await expect(runScopeCheck(intake(), { anthropic: stubClient(json(two)) })).rejects.toBeInstanceOf(
      ScopeCheckParseError,
    )
  })

  it('Müll-Antwort → Parse-Fehler', async () => {
    await expect(runScopeCheck(intake(), { anthropic: stubClient('Leider weiß ich nicht …') })).rejects.toBeInstanceOf(
      ScopeCheckParseError,
    )
  })
})
