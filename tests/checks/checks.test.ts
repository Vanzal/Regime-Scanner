import { describe, expect, it, beforeAll } from 'vitest'
import { Politeness } from '@/lib/collect/politeness'
import type { DnsCollector } from '@/lib/collect/dns'
import type { TlsCollector, TlsInfo } from '@/lib/collect/tls'
import { fetchDriver } from '@/lib/collect/driver'
import { dnsSpfDmarcDkim } from '@/lib/checks/dns_spf_dmarc_dkim'
import { tlsConfig } from '@/lib/checks/tls_config'
import { securityHeaders } from '@/lib/checks/security_headers'
import { legalPages } from '@/lib/checks/legal_pages'
import { orderedChecks } from '@/lib/checks'
import type { ScanContext } from '@/lib/checks/types'
import type { Company, Scan } from '@/lib/store/types'
import type { VerdictFacts } from '@/lib/rules/types'

const COMPANY: Company = {
  id: 'c-test',
  legal_name: 'Testfirma GmbH',
  domain: 'testfirma.de',
  country_hq: 'de',
  created_at: '2026-01-01T00:00:00Z',
}

const SCAN: Scan = {
  id: 's-test',
  company_id: 'c-test',
  status: 'running',
  mode: 'live',
  review_status: 'pending_review',
  intake_json: {},
  facts_json: {},
  created_at: '2026-01-01T00:00:00Z',
}

interface HttpStub {
  bodies: Record<string, string>
  robots?: string
  calls: string[]
}

function httpGate(stub: HttpStub, opts = {}): Politeness {
  return new Politeness({
    minDelayMs: 0,
    budget: 20,
    fetchImpl: async (url) => {
      stub.calls.push(url)
      if (url.endsWith('/robots.txt')) {
        return new Response(stub.robots ?? 'User-agent: *\nAllow: /\n', { status: 200 })
      }
      const body = stub.bodies[url]
      if (body === undefined) return new Response('nf', { status: 404 })
      return new Response(body, { status: 200, headers: { 'content-type': 'text/html' } })
    },
    ...opts,
  })
}

function fakeDns(stub: Record<string, string[]>): DnsCollector {
  return {
    async txt(name) {
      return stub[name] ?? []
    },
    async addresses() {
      return ['203.0.113.10']
    },
    async mx() {
      return []
    },
  }
}

function fakeTls(info: TlsInfo): TlsCollector {
  return {
    async inspect() {
      return info
    },
  }
}

function ctx(opts: {
  politeness: Politeness
  dns: DnsCollector
  tls: TlsCollector
}): ScanContext {
  const facts: VerdictFacts = {
    legalName: COMPANY.legal_name,
    domain: COMPANY.domain,
    countryHq: 'de',
    employees: { min: 50, max: 249 },
    revenueEur: { min: 10_000_001 },
    balanceEur: { min: 10_000_001 },
    sector: 'verarbeitendes_gewerbe',
    subsidiaries: [],
    designatedCritical: false,
    qualifiedTrustService: undefined,
    euCustomersWithSecurityClauses: 'no',
    supplyChainCritical: false,
  }
  return {
    company: COMPANY,
    scan: SCAN,
    intake: {} as ScanContext['intake'],
    facts,
    politeness: opts.politeness,
    dns: opts.dns,
    tls: opts.tls,
    driver: fetchDriver,
    log: () => {},
  }
}

const HOME = 'https://testfirma.de/'

describe('Check dns_spf_dmarc_dkim (kein HTTP gegen die Ziel-Site)', () => {
  it('fehlender DMARC → high; p=none → med; kein DKIM → low', async () => {
    const stub: HttpStub = { bodies: {}, calls: [] }
    const dns = fakeDns({
      'testfirma.de': ['v=spf1 include:spf.protection.outlook.com -all'],
      '_dmarc.testfirma.de': [],
    })
    const c = ctx({ politeness: httpGate(stub), dns, tls: fakeTls({ connectable: true }) })
    const findings = await dnsSpfDmarcDkim.run(c)

    const dmarcMissing = findings.find((f) => f.title.includes('DMARC fehlt'))
    const dkim = findings.find((f) => f.title.includes('DKIM'))
    expect(dmarcMissing?.severity).toBe('high')
    expect(dmarcMissing?.control_refs).toContain('email_auth')
    expect(dkim?.severity).toBe('low')
    // SPF ok → kein SPF-Finding
    expect(findings.some((f) => f.title.includes('SPF'))).toBe(false)
    // Kein HTTP-Request gegen die Ziel-Domain (alles DNS)
    expect(stub.calls.filter((u) => u.includes('testfirma.de') && !u.includes('robots.txt'))).toHaveLength(0)
  })

  it('DMARC p=none erzeugt ein Mittel-Finding mit Policy-Evidenz', async () => {
    const dns = fakeDns({
      'testfirma.de': ['v=spf1 -all'],
      '_dmarc.testfirma.de': ['v=DMARC1; p=none; rua=mailto:dmarc@testfirma.de'],
      'default._domainkey.testfirma.de': ['v=DKIM1; k=rsa; p=MIIBIjANBg'],
    })
    const findings = await dnsSpfDmarcDkim.run(ctx({ politeness: httpGate({ bodies: {}, calls: [] }), dns, tls: fakeTls({ connectable: true }) }))
    const none = findings.find((f) => f.title.includes('p=none'))
    expect(none?.severity).toBe('med')
    expect(findings.some((f) => f.title.includes('DKIM'))).toBe(false)
  })
})

describe('Check tls_config (ein Handshake, keine Port-Scans)', () => {
  it('ablaufendes Zertifikat → med; TLS 1.1 → high', async () => {
    const c = ctx({
      politeness: httpGate({ bodies: {}, calls: [] }),
      dns: fakeDns({}),
      tls: fakeTls({ connectable: true, protocol: 'TLSv1.1', authorized: true, days_until_expiry: 21, valid_to: '2026-10-01' }),
    })
    const findings = await tlsConfig.run(c)
    const expiry = findings.find((f) => f.title.includes('21 Tagen'))
    const proto = findings.find((f) => f.title.includes('TLSv1.1'))
    expect(expiry?.severity).toBe('med')
    expect(proto?.severity).toBe('high')
    expect(proto?.control_refs).toContain('crypto_tls')
  })

  it('nicht vertrauenswürdiges Zertifikat → high', async () => {
    const c = ctx({
      politeness: httpGate({ bodies: {}, calls: [] }),
      dns: fakeDns({}),
      tls: fakeTls({ connectable: true, protocol: 'TLSv1.3', authorized: false }),
    })
    const findings = await tlsConfig.run(c)
    expect(findings.find((f) => f.title.includes('vertrauenswürdig'))?.severity).toBe('high')
  })

  it('gesundes Setup → ein positives info-Finding, keine Fehler', async () => {
    const c = ctx({
      politeness: httpGate({ bodies: {}, calls: [] }),
      dns: fakeDns({}),
      tls: fakeTls({ connectable: true, protocol: 'TLSv1.3', authorized: true, days_until_expiry: 90 }),
    })
    const findings = await tlsConfig.run(c)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.severity).toBe('info')
  })
})

describe('Check security_headers (GET über die Höflichkeits-Gate)', () => {
  it('fehlende HSTS/CSP/XFO/Referrer erzeugen Findings mit Evidenz', async () => {
    const stub: HttpStub = { bodies: { [HOME]: '<html><body>hi</body></html>' }, calls: [] }
    const c = ctx({ politeness: httpGate(stub), dns: fakeDns({}), tls: fakeTls({ connectable: true }) })
    const findings = await securityHeaders.run(c)

    const titles = findings.map((f) => f.title)
    expect(titles.some((t) => t.includes('HSTS'))).toBe(true)
    expect(titles.some((t) => t.includes('Content-Security-Policy'))).toBe(true)
    expect(titles.some((t) => t.includes('Klickjacking'))).toBe(true)
    const hsts = findings.find((f) => f.title.includes('HSTS'))!
    expect(hsts.evidence_json.hsts).toBeNull()
    expect(hsts.control_refs).toContain('web_hardening')
  })

  it('sauber gesetzte Header → kein Finding (außer Informationshinweis), UA stimmt', async () => {
    const stub: HttpStub = {
      bodies: { [HOME]: '<html></html>' },
      calls: [],
    }
    const gate = new Politeness({
      minDelayMs: 0,
      fetchImpl: async (url) => {
        stub.calls.push(url)
        if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /\n', { status: 200 })
        return new Response('<html></html>', {
          status: 200,
          headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'content-security-policy': "default-src 'self'",
            'x-frame-options': 'DENY',
            'referrer-policy': 'strict-origin-when-cross-origin',
          },
        })
      },
    })
    const c = ctx({ politeness: gate, dns: fakeDns({}), tls: fakeTls({ connectable: true }) })
    const findings = await securityHeaders.run(c)
    expect(findings).toHaveLength(0)
    expect(stub.calls).toContain(HOME)
  })
})

describe('Check legal_pages (Impressum/Datenschutz + Fakten-Anreicherung)', () => {
  const home = `<html><body>
    <a href="/impressum">Impressum</a>
    <a href="/datenschutz">Datenschutzerklärung</a>
  </body></html>`
  const impressum = `<html><body>
    Testfirma GmbH, Musterstraße 1, 10115 Berlin, Deutschland
    Registergericht: HRB 12345
    Niederlassung Österreich: Testfirma GmbH, Wien, Österreich
  </body></html>`

  it('findet Impressum/Datenschutz, extrahiert Register und DE/AT-Töchterkontext', async () => {
    const stub: HttpStub = {
      bodies: { [HOME]: home, 'https://testfirma.de/impressum': impressum, 'https://testfirma.de/datenschutz': '<html>DSGVO-Text</html>' },
      calls: [],
    }
    const c = ctx({ politeness: httpGate(stub), dns: fakeDns({}), tls: fakeTls({ connectable: true }) })
    const findings = await legalPages.run(c)

    // DE-Hauptsitz wird nicht als Tochter geführt, AT schon
    expect(c.facts.subsidiaries.map((s) => s.country)).toContain('at')
    expect(c.facts.subsidiaries.map((s) => s.country)).not.toContain('de')
    // Impressum + Datenschutz vorhanden → keine Lücken-Findings, sondern info
    expect(findings.every((f) => f.severity === 'info')).toBe(true)
    expect((findings[0]?.evidence_json.register_hint as string) ?? '').toContain('HRB')
  })

  it('fehlende Verlinkungen → low-Findings (Transparenz)', async () => {
    const stub: HttpStub = { bodies: { [HOME]: '<html><body>Keine Links hier</body></html>' }, calls: [] }
    const c = ctx({ politeness: httpGate(stub), dns: fakeDns({}), tls: fakeTls({ connectable: true }) })
    const findings = await legalPages.run(c)
    expect(findings.filter((f) => f.severity === 'low').length).toBe(2)
    expect(findings.every((f) => f.control_refs.includes('transparency'))).toBe(true)
  })
})

describe('Check-Registry', () => {
  it('legal_pages läuft zuerst (ihre Fakten fließen in die Bewertung)', () => {
    const order = orderedChecks().map((c) => c.id)
    expect(order[0]).toBe('legal_pages')
    expect(order).toContain('dns_spf_dmarc_dkim')
    expect(order).toContain('tls_config')
    expect(order).toContain('security_headers')
  })

  it('jeder Check trägt seine eigene ID in allen Findings', async () => {
    const stub: HttpStub = { bodies: { [HOME]: '<html></html>' }, calls: [] }
    const c = ctx({ politeness: httpGate(stub), dns: fakeDns({}), tls: fakeTls({ connectable: true }) })
    for (const check of orderedChecks()) {
      const findings = await check.run(c)
      for (const f of findings) expect(f.check_id).toBe(check.id)
    }
  })
})

beforeAll(() => {
  // nichts zu tun – Struktur für spätere globale Hooks
})
