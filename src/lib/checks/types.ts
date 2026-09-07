import type { Company, Severity, Scan } from '@/lib/store/types'
import type { VerdictFacts } from '@/lib/rules/types'
import type { Politeness, PoliteResponse } from '@/lib/collect/politeness'
import type { DnsCollector } from '@/lib/collect/dns'
import type { TlsCollector } from '@/lib/collect/tls'
import type { PageDriver } from '@/lib/collect/driver'
import type { IntakeAnswers } from '@/lib/intake/schema'

/**
 * Generische Control-IDs. Die juristische Zitierung („warum das Gesetz das
 * betrifft") lebt ausschließlich in rules/*.yaml (control_areas) und wird
 * erst zur Berichtszeit je anwendbarem Regime aufgelöst – derselbe Befund
 * zitiert in DE § 30 BSIG, in AT den § des NISG, in CH den Art. des ISG.
 */
export const CONTROL_IDS = [
  'email_auth',
  'crypto_tls',
  'web_hardening',
  'vuln_disclosure',
  'asset_mgmt',
  'access_control',
  'patch_mgmt',
  'third_party',
  'transparency',
  'incident_response',
] as const

export type ControlId = (typeof CONTROL_IDS)[number]

export interface FindingDraft {
  check_id: string
  severity: Severity
  title: string
  detail: string
  fix?: string
  control_refs: ControlId[]
  evidence_json: Record<string, unknown>
  source_url?: string | null
}

export interface ScanContext {
  company: Company
  scan: Scan
  intake: IntakeAnswers
  /** Sammlung darf verfeinern (z. B. gefundene Töchter ergänzen) – nie streichen. */
  facts: VerdictFacts
  politeness: Politeness
  dns: DnsCollector
  tls: TlsCollector
  driver: PageDriver
  /** Kurzlog für Pilotbetrieb/Debug – landet im Scan-Protokoll. */
  log: (msg: string) => void
}

export interface Check {
  id: string
  run(ctx: ScanContext): Promise<FindingDraft[]>
}

/** Hilfsbauer für „Prüfung nicht möglich"-Findings – immer severity info. */
export function checkUnavailable(checkId: string, what: string, sourceUrl?: string): FindingDraft {
  return {
    check_id: checkId,
    severity: 'info',
    title: `${what} nicht einsehbar`,
    detail:
      'Diese Prüfung konnte ohne JavaScript-Browser bzw. ohne erreichbare Seite nicht durchgeführt werden. Das ist keine Aussage über Ihre Sicherheit.',
    control_refs: [],
    evidence_json: { reason: 'unavailable' },
    source_url: sourceUrl ?? null,
  }
}

export type { Politeness, PoliteResponse }
