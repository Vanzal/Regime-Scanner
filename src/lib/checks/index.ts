import type { Check } from './types'
import { dnsSpfDmarcDkim } from './dns_spf_dmarc_dkim'
import { tlsConfig } from './tls_config'
import { securityHeaders } from './security_headers'
import { legalPages } from './legal_pages'

/**
 * Check-Registry. Neue Prüfung = eine Datei + eine Zeile hier; die Pipeline
 * ordnungsgemäß: legal_pages zuerst (ihre Fakten-Ausbeute fließt in die
 * Bewertung), danach die übrigen in festgelegter Reihenfolge.
 */
export const CHECKS: Check[] = [legalPages, dnsSpfDmarcDkim, tlsConfig, securityHeaders]

/** Reihenfolge beim Live-Scan: legal_pages zuerst (Fakten-Anreicherung). */
export function orderedChecks(): Check[] {
  const first = CHECKS.find((c) => c.id === 'legal_pages')
  const rest = CHECKS.filter((c) => c.id !== 'legal_pages')
  return first ? [first, ...rest] : rest
}
