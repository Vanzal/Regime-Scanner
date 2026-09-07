import * as cheerio from 'cheerio'
import type { Check, FindingDraft, ControlId } from './types'

const LEGAL_LINK_PATTERNS: Array<{ key: 'impressum' | 'privacy'; re: RegExp }> = [
  { key: 'impressum', re: /impressum|imprint|legal\s*notice|colophon/i },
  { key: 'privacy', re: /datenschutz|privacy|dsgvo|gdpr/i },
]

const COUNTRY_HINTS: Record<string, RegExp> = {
  // Kein \b vor Umlauten: „Ö" ist kein ASCII-\w, eine Wortgrenze existiert dort nicht.
  de: /(?:Deutschland|Germany)\b/i,
  at: /(?:Österreich|Oesterreich|Austria)\b/i,
  ch: /(?:Schweiz|Suisse|Svizzera)\b/i,
  fr: /(?:Frankreich|France)\b/i,
  it: /(?:Italien|Italy)\b/i,
  nl: /(?:Niederlande|Netherlands)\b/i,
  pl: /(?:Polen|Poland)\b/i,
  cz: /(?:Tschechien|Czechia|Tschechische Republik)\b/i,
}

const SUBSIDIARY_CONTEXT = /(tochter|tochtergesellschaft|niederlassung|standort|beteiligung|subsidiar|branch|location|gesellschaft)/i

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).href
  } catch {
    return null
  }
}

/**
 * Rechtsseiten (Impressum, Datenschutz) lesen – die einzige Prüfung, die
 * Fakten für die rechtliche Einordnung anreichern darf:
 * - benannte Länder im Kontext von Tochter/Niederlassung → facts.subsidiaries
 *   (ergänzend; das Intake bleibt die Basis)
 * - Registergerichtsnummer / Rechtsform-Hinweise als Beleg für den Firmennamen
 * Läuft zuerst in der Pipeline (ihre Ausbeute fließt in die Bewertung).
 */
export const legalPages: Check = {
  id: 'legal_pages',
  async run(ctx): Promise<FindingDraft[]> {
    const home = `https://${ctx.company.domain}/`
    const homeRes = await ctx.politeness.get(home)
    if (!homeRes?.body || homeRes.note) {
      return [
        {
          check_id: this.id,
          severity: 'info',
          title: 'Rechtsseiten nicht einsehbar',
          detail: 'Die Startseite konnte nicht gelesen werden; Impressum und Datenschutzerklärung blieben unberücksichtigt. Keine Aussage über Ihre Sicherheit.',
          control_refs: [] satisfies ControlId[],
          evidence_json: { url: home, note: homeRes?.note ?? 'robots_or_budget' },
          source_url: home,
        },
      ]
    }

    const evidence: Record<string, unknown> = { home_url: home, home_status: homeRes.status }
    const $ = cheerio.load(homeRes.body)
    const found: Record<'impressum' | 'privacy', string | null> = { impressum: null, privacy: null }

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return
      const abs = absolutize(href, home)
      if (!abs || !/https?:/.test(abs)) return
      const text = `${$(el).text()} ${href}`
      for (const p of LEGAL_LINK_PATTERNS) {
        if (!found[p.key] && p.re.test(text)) found[p.key] = abs
      }
    })
    evidence.legal_pages_found = found

    const findings: FindingDraft[] = []

    // Impressum lesen (Transparenz-Pflicht deutscher Seitenlieferanten)
    if (found.impressum) {
      const res = await ctx.politeness.get(found.impressum)
      if (res?.body && !res.note) {
        const $$ = cheerio.load(res.body)
        const text = $$('body').text().replace(/\s+/g, ' ').slice(0, 20_000)

        const register = text.match(/\b(HRB|HRA|FN|Che[^a-z]|Registergericht)[:\s-]*\s?(\d{2,10}[^\s,;]{0,12})/i)
        evidence.register_hint = register ? `${register[1]} ${register[2]}` : null

        // Länder im Tochter/Niederlassung-Kontext → Fakten anreichern
        const known = new Set(ctx.facts.subsidiaries.map((s) => s.country))
        const extracted: string[] = []
        for (const sentence of text.split(/[.;•\n]/)) {
          if (!SUBSIDIARY_CONTEXT.test(sentence)) continue
          for (const [country, re] of Object.entries(COUNTRY_HINTS)) {
            if (re.test(sentence) && country !== ctx.company.country_hq && !known.has(country)) {
              known.add(country)
              extracted.push(country)
            }
          }
        }
        evidence.subsidiary_countries_extracted = extracted
        for (const country of extracted) {
          ctx.facts.subsidiaries.push({ country })
        }

        const contacts = [...res.body.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+)/gi)].map((m) => m[1])
        evidence.impressum_emails = [...new Set(contacts)].slice(0, 5)
      } else {
        evidence.impressum_fetch_note = res?.note ?? 'blocked'
      }
    }

    if (!found.impressum && ctx.company.country_hq === 'de') {
      findings.push({
        check_id: this.id,
        severity: 'low',
        title: 'Kein Impressum von der Startseite aus verlinkt',
        detail:
          'Von der Startseite aus war kein Impressum auffindbar (§ 5 TMG bzw. § 5 DDG). Für Kunden und Behörden fehlt die erlebbare Verantwortlichkeit.',
        fix: 'Impressum veröffentlichen und prominent verlinken (Fußzeile), mit vollständiger Firmenbezeichnung und Kontaktdaten.',
        control_refs: ['transparency'] satisfies ControlId[],
        evidence_json: evidence,
        source_url: home,
      })
    }

    if (!found.privacy) {
      findings.push({
        check_id: this.id,
        severity: 'low',
        title: 'Keine Datenschutzerklärung von der Startseite aus verlinkt',
        detail:
          'Von der Startseite aus war keine Datenschutzerklärung auffindbar. DSGVO-Pflichtangaben (Art. 13/14) müssen leicht zugänglich sein – und Meldeprozesse berühren personenbezogene Daten.',
        fix: 'Datenschutzerklärung veröffentlichen und in der Fußzeile verlinken; Verarbeitungen inkl. Meldedaten nach Art. 30 beschreiben.',
        control_refs: ['transparency'] satisfies ControlId[],
        evidence_json: evidence,
        source_url: home,
      })
    }

    // Nimmseiten-Log: wenn nichts auffiel, dokumentieren, dass wir gesucht haben
    if (findings.length === 0) {
      findings.push({
        check_id: this.id,
        severity: 'info',
        title: 'Rechtsseiten vorhanden',
        detail: 'Impressum und Datenschutzerklärung waren von der Startseite aus erreichbar und wurden ausgewertet (keine Auffälligkeiten).',
        control_refs: ['transparency'] satisfies ControlId[],
        evidence_json: evidence,
        source_url: found.impressum ?? home,
      })
    }

    return findings
  },
}
