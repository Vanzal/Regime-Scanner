import { IntakeSchema, type IntakeAnswers } from '@/lib/intake/schema'
import { evaluateAll } from '@/lib/rules/evaluate'
import { loadRules } from '@/lib/rules/loader'
import type { RulesFile } from '@/lib/rules/schema'
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
  evidence?: string
  sourceUrl?: string
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
  sourceUrls: string[]
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

/** English marketing overlays for fixture findings (fixtures stay German for DE demo path). */
const GAP_EN: Record<string, { title: string; detail: string; fix?: string }> = {
  'DMARC fehlt vollständig': {
    title: 'DMARC record missing entirely',
    detail:
      'beispielwerk.de publishes no DMARC record (_dmarc). Mail can be spoofed in your name without policy checks — a common entry point for incidents that may become reportable.',
    fix: 'Publish a DMARC TXT record at _dmarc.beispielwerk.de (start with p=none, then quarantine, then reject) and monitor rua reports.',
  },
  'Kein DKIM-Signaturhinweis auffindbar': {
    title: 'No DKIM signature hint found',
    detail:
      'Common selectors returned no DKIM record. Without DKIM, e-mail authentication stays incomplete even when SPF is set.',
    fix: 'Enable DKIM signing in your mail system and publish the public key as a TXT record.',
  },
  'HSTS (Strict-Transport-Security) fehlt': {
    title: 'HSTS (Strict-Transport-Security) missing',
    detail:
      'The primary host does not force HTTPS on return visits. Downgrade attacks to cleartext remain possible.',
    fix: 'Set Strict-Transport-Security: max-age=31536000; includeSubDomains — roll out with a short max-age first.',
  },
  'TLS-Zertifikat läuft in 21 Tagen ab': {
    title: 'TLS certificate expires in 21 days',
    detail:
      'The server certificate is valid, but remaining lifetime is under 30 days. An expired certificate breaks encrypted channels used in reporting workflows.',
    fix: 'Renew the certificate and automate renewal (e.g. ACME) with expiry monitoring.',
  },
  'Kein security.txt (RFC 9116)': {
    title: 'No security.txt (RFC 9116)',
    detail:
      'No /.well-known/security.txt exists. Third parties cannot reach a defined security contact — evidence of responsible disclosure is missing.',
    fix: 'Publish /.well-known/security.txt with Contact and Expires fields (RFC 9116).',
  },
  'Veraltete WordPress-Hauptversion im öffentlichen Fußabdruck': {
    title: 'Outdated WordPress major version in public footprint',
    detail:
      'Meta generator and asset paths suggest WordPress 5.x (unsupported major). Not a CVE claim — an indicator of weak patch management.',
    fix: 'Upgrade to a supported major; enable automated minor updates; remove version hints from public metadata.',
  },
  'DMARC nur im Monitoring-Modus (p=none)': {
    title: 'DMARC in monitoring mode only (p=none)',
    detail:
      'A DMARC record exists, but p=none only reports spoofing — it does not block it. Material for an IT provider with EU customer security clauses.',
    fix: 'Tighten DMARC stepwise: p=quarantine with pct=25, then p=reject; review rua reports.',
  },
  'Content-Security-Policy fehlt': {
    title: 'Content-Security-Policy missing',
    detail: 'Without CSP, injected scripts (XSS) via third-party widgets remain easier to land.',
    fix: 'Introduce CSP in report-only mode, then enforce (default-src self; script-src self …).',
  },
  'Veraltete TLS-Versionen (1.0/1.1) werden akzeptiert': {
    title: 'Legacy TLS versions (1.0/1.1) still accepted',
    detail:
      'The server still negotiates TLS 1.0/1.1. Those protocols are broken; allowing them conflicts with crypto baselines reporting regimes expect.',
    fix: 'Restrict to TLS 1.2 minimum (prefer 1.3); disable weak cipher suites.',
  },
  'Verwaltungszugang öffentlich verlinkt (/wp-login.php, /admin)': {
    title: 'Admin surfaces publicly linked (/wp-login.php, /admin)',
    detail:
      'The homepage links to /admin; /wp-login.php is publicly reachable. Exposed login surfaces are credential-stuffing targets. No auth attempts were made.',
    fix: 'Put admin paths behind VPN/SSO, enforce rate limits + 2FA, remove direct homepage links.',
  },
  'Weder HSTS noch X-Frame-Options': {
    title: 'Neither HSTS nor X-Frame-Options',
    detail: 'The host does not enforce HTTPS and allows framing from third sites (clickjacking).',
    fix: 'Set HSTS and X-Frame-Options: DENY (or CSP frame-ancestors).',
  },
  'Impressum unvollständig (keine Gruppenangabe)': {
    title: 'Imprint incomplete (no group disclosure)',
    detail:
      'The imprint does not mention the German subsidiary. Relevant for cross-border reporting scope (DE/AT/CH) and transparency duties.',
    fix: 'List affiliated entities in the imprint; name responsibilities per location.',
  },
}

const REGIME_META: Record<string, { code: string; name: string; law: string }> = {
  de: { code: 'DE', name: 'Germany', law: 'NIS2UmsuCG/BSIG' },
  at: { code: 'AT', name: 'Austria', law: 'NISG 2024' },
  ch: { code: 'CH', name: 'Switzerland', law: 'ISG' },
}

const DISCLAIMER_EN =
  'Synthetic sample. Automated orientation from public sources and stated answers — not legal advice. Timelines current as of September 2026.'
const DISCLAIMER_DE =
  'Synthetisches Muster. Automatisierte Orientierung aus öffentlichen Quellen und angegebenen Antworten — keine Rechtsberatung. Fristen Stand September 2026.'

function statusFromApplicable(value: Applicable): SampleStatus {
  if (value === 'applicable') return 'in'
  if (value === 'not_applicable') return 'out'
  return 'unclear'
}

function firstReasonLine(md: string): string {
  return (
    md
      .split('\n')
      .map((line) => line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
      .find((line) => line.length > 0) ?? md.trim()
  )
}

function evidenceSummary(evidence: Record<string, unknown> | undefined): string | undefined {
  if (!evidence) return undefined
  const parts: string[] = []
  for (const [key, value] of Object.entries(evidence)) {
    if (value === null || value === undefined) {
      parts.push(`${key}: none`)
      continue
    }
    if (Array.isArray(value)) {
      parts.push(`${key}: ${value.slice(0, 4).join(', ')}`)
      continue
    }
    if (typeof value === 'object') continue
    parts.push(`${key}: ${String(value)}`)
  }
  return parts.slice(0, 4).join(' · ') || undefined
}

function toSampleRegime(verdict: RegimeVerdict, rules: RulesFile[]): SampleRegime {
  const meta = REGIME_META[verdict.regime] ?? {
    code: verdict.regime.toUpperCase(),
    name: verdict.regime,
    law: verdict.rulesVersionLabel,
  }
  const file = rules.find((r) => r.regime === verdict.regime)
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
    sourceUrls: file?.source_urls?.slice(0, 2) ?? [],
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

function localizeGap(
  finding: FixtureScan['findings'][number],
  locale: 'en' | 'de',
): SampleGap {
  const en = GAP_EN[finding.title]
  const useEn = locale === 'en' && en
  return {
    severity: finding.severity,
    title: useEn ? en.title : finding.title,
    detail: useEn ? en.detail : finding.detail,
    fix: useEn ? en.fix ?? finding.fix : finding.fix,
    evidence: evidenceSummary(finding.evidence_json),
    sourceUrl: finding.source_url,
  }
}

export function listSampleProfileIds(): SampleProfileId[] {
  return ['mittelstand-de', 'service-at', 'ch-eu-subsidiary']
}

export function buildSampleReport(id: SampleProfileId, locale: 'en' | 'de' = 'en'): SampleReport {
  const fixtures = loadFixtures()
  const fixture = fixtures.find((f) => f.slug === id)
  if (!fixture) throw new Error(`Missing sample fixture: ${id}`)

  const intake = fixtureToIntake(fixture)
  const facts = buildFactsFromIntake(intake)
  const rules = loadRules()
  const verdicts = evaluateAll(rules, facts)
  const meta = PROFILE_META[id]

  return {
    id,
    slug: fixture.slug,
    synthetic: true,
    company: {
      legal_name: fixture.company.legal_name,
      domain: fixture.company.domain,
      country_hq: fixture.company.country_hq,
      sector: meta.sector[locale],
      size: meta.size[locale],
    },
    intake,
    regimes: ['de', 'at', 'ch']
      .map((code) => verdicts.find((v) => v.regime === code))
      .filter((v): v is RegimeVerdict => Boolean(v))
      .map((v) => toSampleRegime(v, rules)),
    gaps: fixture.findings
      .filter((f) => f.severity !== 'info')
      .map((f) => localizeGap(f, locale)),
    disclaimer: locale === 'de' ? DISCLAIMER_DE : DISCLAIMER_EN,
  }
}

export function buildAllSampleReports(locale: 'en' | 'de' = 'en'): SampleReport[] {
  return listSampleProfileIds().map((id) => buildSampleReport(id, locale))
}

export function sampleProfileCopy(id: SampleProfileId, locale: 'en' | 'de') {
  return PROFILE_META[id]
    ? { size: PROFILE_META[id].size[locale], sector: PROFILE_META[id].sector[locale] }
    : { size: '', sector: '' }
}
