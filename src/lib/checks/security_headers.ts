import type { Check, FindingDraft, ControlId } from './types'

interface HeaderFinding {
  header: string
  severity: 'low' | 'med' | 'info'
  title: string
  detail: string
  fix: string
}

const EXPECTED: Array<(headers: Record<string, string>) => HeaderFinding | null> = [
  (h) =>
    h['strict-transport-security']
      ? null
      : {
          header: 'strict-transport-security',
          severity: 'med',
          title: 'HSTS (Strict-Transport-Security) fehlt',
          detail: 'Der primäre Host erzwingt kein HTTPS für Folgebesuche. Downgrade-Angriffe auf Klartext-Verbindungen bleiben möglich.',
          fix: 'Header „Strict-Transport-Security: max-age=31536000; includeSubDomains“ setzen, Einführung mit kleiner max-age testen.',
        },
  (h) =>
    h['content-security-policy']
      ? null
      : {
          header: 'content-security-policy',
          severity: 'low',
          title: 'Content-Security-Policy fehlt',
          detail: 'Ohne CSP können eingeschleuste Skripte (z. B. über eine Schwachstelle im CMS) ungehindert nachladen und ausführen.',
          fix: 'CSP einführen – zunächst report-only messen, dann erzwingen (script-src, frame-ancestors, object-src).',
        },
  (h) =>
    h['x-frame-options'] || h['content-security-policy']?.includes('frame-ancestors')
      ? null
      : {
          header: 'x-frame-options',
          severity: 'low',
          title: 'Klickjackingschutz fehlt (X-Frame-Options / frame-ancestors)',
          detail: 'Die Seite kann in Frames fremder Websites eingebettet werden; Nutzerinnen können zur ungewollten Interaktion verleitet werden.',
          fix: 'X-Frame-Options: DENY (oder CSP frame-ancestors none) setzen.',
        },
  (h) =>
    h['referrer-policy']
      ? null
      : {
          header: 'referrer-policy',
          severity: 'info',
          title: 'Referrer-Policy fehlt',
          detail: 'Vollständige URLs können an externe Seiten weitergegeben werden, wenn Nutzerinnen Links folgen – unbeabsichtigte Preisgabe interner Pfade.',
          fix: 'Header „Referrer-Policy: strict-origin-when-cross-origin“ setzen.',
        },
]

/**
 * HTTP-Sicherheitsheader der Startseite (ein GET über die Höflichkeits-Gate).
 */
export const securityHeaders: Check = {
  id: 'security_headers',
  async run(ctx): Promise<FindingDraft[]> {
    const url = `https://${ctx.company.domain}/`
    const res = await ctx.politeness.get(url)
    if (!res || res.body === null || res.note) {
      return [
        {
          check_id: this.id,
          severity: 'info',
          title: 'Startseite nicht einsehbar',
          detail: 'Die Startseite konnte nicht gelesen werden (robots.txt, Größe, JavaScript-lastig oder Fehler). Keine Aussage über Ihre Sicherheit.',
          control_refs: [] satisfies ControlId[],
          evidence_json: { url, note: res?.note ?? 'robots_or_budget' },
          source_url: url,
        },
      ]
    }

    const evidence = {
      url,
      status: res.status,
      hsts: res.headers['strict-transport-security'] ?? null,
      csp: res.headers['content-security-policy'] ?? null,
      x_frame_options: res.headers['x-frame-options'] ?? null,
      referrer_policy: res.headers['referrer-policy'] ?? null,
      permissions_policy: res.headers['permissions-policy'] ?? null,
    }
    const findings: FindingDraft[] = []
    for (const rule of EXPECTED) {
      const f = rule(res.headers)
      if (f) {
        findings.push({
          check_id: this.id,
          severity: f.severity,
          title: f.title,
          detail: f.detail,
          fix: f.fix,
          control_refs: ['web_hardening', 'crypto_tls'] satisfies ControlId[],
          evidence_json: evidence,
          source_url: url,
        })
      }
    }
    return findings
  },
}
