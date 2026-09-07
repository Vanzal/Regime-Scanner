import type { Check, FindingDraft, ControlId } from './types'

/**
 * TLS-Konfiguration des primären Hosts: ein einziger Handshake :443 mit SNI
 * (gesammelt über den tls-Collector und gecacht). Wir prüfen Zertifikats-
 * Restlaufzeit und Protokollversion – keine Cipher-Force-Tests, keine
 * Port-Scans.
 */
export const tlsConfig: Check = {
  id: 'tls_config',
  async run(ctx): Promise<FindingDraft[]> {
    const host = ctx.company.domain
    const info = await ctx.tls.inspect(host)
    const sourceUrl = `https://${host}:443`
    const findings: FindingDraft[] = []

    if (!info.connectable) {
      findings.push({
        check_id: this.id,
        severity: 'info',
        title: 'HTTPS-Endpunkt nicht erreichbar',
        detail: `Auf ${host}:443 konnte kein TLS-Handshake abgeschlossen werden (${info.error ?? 'unbekannter Grund'}). Entweder läuft die Seite nur anders erreichbar, oder der Verschlüsselungsendpunkt fehlt.`,
        control_refs: [] satisfies ControlId[],
        evidence_json: { ...info },
        source_url: sourceUrl,
      })
      return findings
    }

    if (info.authorized === false) {
      findings.push({
        check_id: this.id,
        severity: 'high',
        title: 'TLS-Zertifikat wird nicht vertrauenswürdig verifiziert',
        detail:
          'Das Zertifikat konnte nicht gegen eine bekannte Zertifikatsstelle verifiziert werden (selbstsigniert, falscher Hostname oder abgelaufen). Besucherinnen und Maschinen erhalten Warnungen; verschlüsselte Meldeprozesse sind angreifbar.',
        fix: 'Gültiges Zertifikat einer anerkannten CA einsetzen (z. B. ACME/Let’s Encrypt) und Hostname-Übereinstimmung prüfen.',
        control_refs: ['crypto_tls'] satisfies ControlId[],
        evidence_json: { ...info },
        source_url: sourceUrl,
      })
    } else if (typeof info.days_until_expiry === 'number' && Number.isFinite(info.days_until_expiry)) {
      if (info.days_until_expiry <= 0) {
        findings.push({
          check_id: this.id,
          severity: 'high',
          title: 'TLS-Zertifikat ist abgelaufen',
          detail: 'Das Serverzertifikat ist abgelaufen. Moderne Browser und API-Clients verweigern die Verbindung; Melde- und Incident-Prozesse brechen.',
          fix: 'Zertifikat sofort erneuern und automatische Verlängerung (z. B. ACME mit Monitoring) einrichten.',
          control_refs: ['crypto_tls'] satisfies ControlId[],
          evidence_json: { ...info },
          source_url: sourceUrl,
        })
      } else if (info.days_until_expiry < 30) {
        findings.push({
          check_id: this.id,
          severity: 'med',
          title: `TLS-Zertifikat läuft in ${info.days_until_expiry} Tagen ab`,
          detail: 'Das Serverzertifikat ist gültig, aber die Restlaufzeit liegt unter 30 Tagen. Ein abgelaufenes Zertifikat unterbricht verschlüsselte Kommunikation und Meldeprozesse.',
          fix: 'Zertifikat erneuern und automatische Verlängerung (z. B. ACME/Let’s Encrypt mit Renewal-Monitoring) einrichten.',
          control_refs: ['crypto_tls'] satisfies ControlId[],
          evidence_json: { ...info },
          source_url: sourceUrl,
        })
      }
    }

    if (info.protocol && /^TLSv1(\.0|\.1)?$/.test(info.protocol)) {
      findings.push({
        check_id: this.id,
        severity: 'high',
        title: `Veraltetes TLS-Protokoll aktiv (${info.protocol})`,
        detail:
          'Der Endpunkt verhandelt noch TLS 1.0/1.1. Beide Versionen sind offiziell deprecatet und in modernen Clients deaktiviert; Angreifer können Downgrader erzwingen.',
        fix: 'TLS 1.2 als Minimum konfigurieren (Ziel: TLS 1.3 mit 1.2 als Fallback), alte Ciphersuiten entfernen.',
        control_refs: ['crypto_tls'] satisfies ControlId[],
        evidence_json: { ...info },
        source_url: sourceUrl,
      })
    }

    if (findings.length === 0) {
      // Alles im grünen Bereich → einen positiven Hinweis dokumentieren
      findings.push({
        check_id: this.id,
        severity: 'info',
        title: 'TLS-Grundabsicherung vorhanden',
        detail: `Protokoll ${info.protocol ?? 'unbekannt'}, Zertifikat gültig${info.days_until_expiry !== undefined ? ` (noch ${info.days_until_expiry} Tage)` : ''}. Details im Anhang der Rohdaten.`,
        control_refs: ['crypto_tls'] satisfies ControlId[],
        evidence_json: { ...info },
        source_url: sourceUrl,
      })
    }

    return findings
  },
}
