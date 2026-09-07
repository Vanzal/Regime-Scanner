import Anthropic from '@anthropic-ai/sdk'
import type { IntakeAnswers } from '@/lib/intake/schema'
import { SCOPE_CHECK_SYSTEM_PROMPT } from './prompt'
import { buildScopeCheckUserMessage } from './message'
import { ScopeCheckResponseSchema, type ScopeCheckResult } from './schema'

/** Modell laut MVP-Briefing („DACH Regulatory Scope-Check“). */
export const SCOPE_CHECK_MODEL = process.env.SCOPE_CHECK_MODEL ?? 'claude-sonnet-4-6'
/** Vom Briefing vorgegebenes Limit; bei stop_reason "max_tokens" schlägt der Call sauber fehl. */
export const SCOPE_CHECK_MAX_TOKENS = 1000

/** Fehlerklassen für sauberes UI-Handling, kein String-Matching. */
export class ScopeCheckError extends Error {}
export class ScopeCheckTruncatedError extends ScopeCheckError {}
export class ScopeCheckParseError extends ScopeCheckError {}

/** Struktur-Minimum für Tests: der echte Anthropic-Client erfüllt es. */
export interface ScopeCheckClient {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>
  }
}

/**
 * Extrahiert das JSON-Objekt aus der Antwort. Das Modell wird per Prompt auf
 * „nur JSON“ verpflichtet, aber defensively: Codefences oder Preamble stören
 * nicht, solange irgendwo ein {…}-Objekt steckt.
 */
export function extractJsonObject(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new ScopeCheckParseError('Antwort enthält kein JSON-Objekt')
  }
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch (err) {
    throw new ScopeCheckParseError(`JSON ist ungültig: ${err instanceof Error ? err.message : String(err)}`)
  }
}

function parseResult(raw: string): ScopeCheckResult {
  const parsed = ScopeCheckResponseSchema.safeParse(extractJsonObject(raw))
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new ScopeCheckParseError(`Antwort verletzt das Scope-Check-Schema: ${issues}`)
  }
  return parsed.data
}

/**
 * Führt den LLM-Scope-Check aus: genau eine User-Message, keine Historie.
 * Ergebnis ist das validierte JSON – bei Truncation/Schema-Verstoß eine
 * typisierte Exception, nie ein geratenes Ergebnis.
 */
export async function runScopeCheck(
  intake: IntakeAnswers,
  deps: { anthropic?: ScopeCheckClient; model?: string } = {},
): Promise<ScopeCheckResult> {
  const client = deps.anthropic ?? new Anthropic()
  const response = await client.messages.create({
    model: deps.model ?? SCOPE_CHECK_MODEL,
    max_tokens: SCOPE_CHECK_MAX_TOKENS,
    // System-Prompt ist über alle Scans identisch → Cache-Breakpoint lohnt.
    system: [{ type: 'text', text: SCOPE_CHECK_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: buildScopeCheckUserMessage(intake) }],
  })

  if (response.stop_reason === 'max_tokens') {
    throw new ScopeCheckTruncatedError(
      'Scope-Check-Antwort wurde bei 1000 Tokens abgeschnitten – Modell-Einstellung prüfen.',
    )
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  return parseResult(text)
}
