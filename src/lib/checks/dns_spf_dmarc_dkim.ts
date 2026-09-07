import type { Check, ScanContext, FindingDraft, ControlId } from './types'

const DKIM_SELECTORS = ['default', 'selector1', 'selector2', 'google', 'k1', 'mail']

function parseTag(record: string, tag: string): string | null {
  const m = record.match(new RegExp(`(?:^|;)\\s*${tag}\\s*=([^;]+)`, 'i'))
  return m ? m[1].trim() : null
}

/**
 * E-Mail-Authentifizierung im DNS: SPF (Apex), DMARC (_dmarc), DKIM (gängige
 * Selektoren). Reine DNS-Leseabfragen – kein HTTP-Traffic gegen die Ziel-Site,
 * die Höflichkeits-Gate wird nicht belastet.
 */
export const dnsSpfDmarcDkim: Check = {
  id: 'dns_spf_dmarc_dkim',
  async run(ctx: ScanContext): Promise<FindingDraft[]> {
    const domain = ctx.company.domain
    const findings: FindingDraft[] = []
    const evidence: Record<string, unknown> = {}

    const apexTxt = await ctx.dns.txt(domain)
    const spf = apexTxt.find((r) => /^v=spf1/i.test(r.trim())) ?? null
    evidence.spf_record = spf

    const dmarcRecords = await ctx.dns.txt(`_dmarc.${domain}`)
    const dmarc = dmarcRecords.find((r) => /^v=DMARC1/i.test(r.trim())) ?? null
    evidence.dmarc_record = dmarc

    const selectorsChecked: string[] = []
    let dkimFound: string | null = null
    for (const sel of DKIM_SELECTORS) {
      selectorsChecked.push(sel)
      const records = await ctx.dns.txt(`${sel}._domainkey.${domain}`)
      const hit = records.find((r) => r.includes('p='))
      if (hit) {
        dkimFound = sel
        break
      }
    }
    evidence.selectors_checked = selectorsChecked
    evidence.dkim_selector_found = dkimFound

    // DMARC fehlt → hoch (maßgeblicher Spoofing-Schutz)
    if (!dmarc) {
      findings.push({
        check_id: this.id,
        severity: 'high',
        title: 'DMARC fehlt vollständig',
        detail: `Die Domain ${domain} veröffentlicht keinen DMARC-Eintrag (_dmarc). E-Mails im Namen Ihrer Domain können ohne Prüfung gefälscht (Spoofing/Phishing) werden – ein klassischer Einstiegspunkt für Vorfälle, die meldepflichtig werden können.`,
        fix: `DMARC-TXT-Record unter _dmarc.${domain} anlegen, z. B. „v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}“ – schrittweise von p=none über p=quarantine zu p=reject.`,
        control_refs: ['email_auth'] satisfies ControlId[],
        evidence_json: evidence,
        source_url: `https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`,
      })
    } else {
      const policy = (parseTag(dmarc, 'p') ?? 'none').toLowerCase()
      evidence.dmarc_policy = policy
      if (policy === 'none') {
        findings.push({
          check_id: this.id,
          severity: 'med',
          title: 'DMARC nur im Monitor-Modus (p=none)',
          detail:
            'Ihr DMARC-Eintrag wendet keine Richtlinie an: gefälschte E-Mails im Namen Ihrer Domain werden weiterhin zugestellt. Empfängerfilter erhalten keinen Durchgriff.',
          fix: 'DMARC schrittweise härten: erst p=quarantine, nach Monitoring der Reports p=reject; rua-Adresse für Auswertungen beibehalten.',
          control_refs: ['email_auth'] satisfies ControlId[],
          evidence_json: evidence,
          source_url: `https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`,
        })
      }
    }

    if (!spf) {
      findings.push({
        check_id: this.id,
        severity: 'med',
        title: 'Kein SPF-Eintrag',
        detail: `Die Domain ${domain} veröffentlicht keinen SPF-Record (v=spf1). Empfangende Server können nicht prüfen, welche Systeme berechtigt sind, E-Mails für Ihre Domain zu senden.`,
        fix: 'SPF-TXT-Record am Apex anlegen (v=spf1 mit Ihren Sendern,Ende mit -all oder ~all).',
        control_refs: ['email_auth'] satisfies ControlId[],
        evidence_json: evidence,
        source_url: `https://dns.google/resolve?name=${domain}&type=TXT`,
      })
    }

    if (!dkimFound) {
      findings.push({
        check_id: this.id,
        severity: 'low',
        title: 'Kein DKIM-Signaturhinweis auffindbar',
        detail: `Für gängige Selektoren (${DKIM_SELECTORS.join(', ')}) wurde kein DKIM-Eintrag gefunden. Ohne DKIM bleibt die E-Mail-Authentifizierung lückenhaft, auch wenn SPF korrekt gesetzt ist.`,
        fix: 'DKIM-Signierung im Mailsystem aktivieren (Selektor z. B. „default“ oder „selector1“) und öffentlichen Schlüssel als TXT-Record veröffentlichen.',
        control_refs: ['email_auth'] satisfies ControlId[],
        evidence_json: evidence,
        source_url: `https://dns.google/resolve?name=default._domainkey.${domain}&type=TXT`,
      })
    }

    return findings
  },
}
