import { IntakeSchema, type IntakeAnswers } from '@/lib/intake/schema'
import { evaluateAll } from '@/lib/rules/evaluate'
import { loadRules } from '@/lib/rules/loader'
import type { Applicable, RegimeVerdict } from '@/lib/rules/types'
import { buildFactsFromIntake } from '@/lib/scan/facts'
import { loadFixtures, type FixtureScan } from '@/lib/scan/fixtures'

export type SampleProfileId = 'mittelstand-de' | 'service-at' | 'ch-eu-subsidiary'

export type SampleStatus = 'in' | 'out' | 'unclear'

export interface SampleGap {
  severity: 'info' | 'low' | 'med' | 'high'
  title: string
  detail: string
  fix?: string
}

export interface SampleDeadline {
  hours: number
  label: string
  authority: string
  channel: string
}

export interface SampleRegime {
  code: string
  name: string
  law: string
  status: SampleStatus
  applicable: Applicable
  confidence: number
  reason: string
  traceSummary: string
  unclearCode?: string | null
  deadlines: SampleDeadline[]
}

export interface SampleReport {
  id: SampleProfileId
  slug: string
  synthetic: true
  company: {
    legal_name: string
    domain: string
    country_hq: string
    sector: string
    size: string
  }
  intake: IntakeAnswers
  regimes: SampleRegime[]
  gaps: SampleGap[]
  disclaimer: string
}

const PROFILE_META: Record<
  SampleProfileId,
  { size: Record<'en' | 'de', string>; sector: Record<'en' | 'de', string> }
> = {
  'mittelstand-de': {
    size: { en: '50–249 employees · €10–50m revenue', de: '50–249 Beschäftigte · 10–50 Mio. € Umsatz' },
    sector: { en: 'Manufacturing (machinery)', de: 'Verarbeitendes Gewerbe (Maschinenbau)' },
  },
  'service-at': {
    size: { en: '50–249 employees · €10–50m revenue', de: '50–249 Beschäftigte · 10–50 Mio. € Umsatz' },
    sector: { en: 'IT / network services (B2B)', de: 'IT-/Netzwerkdienste (B2B)' },
  },
  'ch-eu-subsidiary': {
    size: { en: '250+ employees · €50m+ revenue', de: '250+ Beschäftigte · über 50 Mio. € Umsatz' },
    sector: { en: 'Digital infrastructure · DE subsidiary', de: 'Digitale Infrastruktur · DE-Tochter' },
  },
}

const REGIME_META: Record<string, { code: string; name: string; law: string }> = {
  de: { code: 'DE', name: 'Germany', law: 'NIS2UmsuCG/BSIG' },
  at: { code: 'AT', name: 'Austria', law: 'NISG 2024' },
  ch: { code: 'CH', name: 'Switzerland', law: 'ISG' },
}

function statusFromApplicable(value: Applicable): SampleStatus {
  if (value === 'applicable') return 'in'
  if (value === 'not_applicable') return 'out'
  return 'unclear'
}

function firstReasonLine(md: string): string {
  return md
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
    .find((line) => line.length > 0) ?? md.trim()
}

function toSampleRegime(verdict: RegimeVerdict): SampleRegime {
  const meta = REGIME_META[verdict.regime] ?? {
    code: verdict.regime.toUpperCase(),
    name: verdict.regime,
    law: verdict.rulesVersionLabel,
  }
  return {
    code: meta.code,
    name: meta.name,
    law: meta.law,
    status: statusFromApplicable(verdict.applicable),
    applicable: verdict.applicable,
    confidence: verdict.confidence,
    reason: firstReasonLine(verdict.reasoningMd),
    traceSummary: verdict.thresholdTrace.summary ?? firstReasonLine(verdict.reasoningMd),
    unclearCode: verdict.unclearCode ?? null,
    deadlines: verdict.deadlines.stages.map((stage) => ({
      hours: stage.hours,
      label: stage.label ?? stage.key,
      authority: verdict.deadlines.authority.name,
      channel: verdict.deadlines.authority.format ?? verdict.deadlines.authority.portal_url,
    })),
  }
}

function fixtureToIntake(fixture: FixtureScan): IntakeAnswers {
  return IntakeSchema.parse(fixture.intake)
}

const DISCLAIMER =
  'Simulated sample (synthetic demo data). NexusScope provides regulatory readiness intelligence based on referenced public sources and stated answers. Results are intended to support internal assessment and should be reviewed by qualified legal or compliance professionals where appropriate. Timelines current as of September 2026.'

export function listSampleProfileIds(): SampleProfileId[] {
  return ['mittelstand-de', 'service-at', 'ch-eu-subsidiary']
}

export function buildSampleReport(id: SampleProfileId): SampleReport {
  const fixtures = loadFixtures()
  const fixture = fixtures.find((f) => f.slug === id)
  if (!fixture) throw new Error(`Missing sample fixture: ${id}`)

  const intake = fixtureToIntake(fixture)
  const facts = buildFactsFromIntake(intake)
  const verdicts = evaluateAll(loadRules(), facts)
  const meta = PROFILE_META[id]

  return {
    id,
    slug: fixture.slug,
    synthetic: true,
    company: {
      legal_name: fixture.company.legal_name,
      domain: fixture.company.domain,
      country_hq: fixture.company.country_hq,
      sector: meta.sector.en,
      size: meta.size.en,
    },
    intake,
    regimes: ['de', 'at', 'ch']
      .map((code) => verdicts.find((v) => v.regime === code))
      .filter((v): v is RegimeVerdict => Boolean(v))
      .map(toSampleRegime),
    gaps: fixture.findings
      .filter((f) => f.severity !== 'info')
      .map((f) => ({
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        fix: f.fix,
      })),
    disclaimer: DISCLAIMER,
  }
}

export function buildAllSampleReports(): SampleReport[] {
  return listSampleProfileIds().map(buildSampleReport)
}

export function sampleProfileCopy(id: SampleProfileId, locale: 'en' | 'de') {
  return PROFILE_META[id]
    ? { size: PROFILE_META[id].size[locale], sector: PROFILE_META[id].sector[locale] }
    : { size: '', sector: '' }
}
