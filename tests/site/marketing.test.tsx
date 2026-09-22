import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDict } from '@/i18n'
import { buildSampleReport } from '@/lib/sample-reports'
import { SiteFooter } from '@/components/site/site-footer'
import { SampleReportCard } from '@/components/site/sample-report-card'
import { SiteHeader } from '@/components/site/site-header'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('marketing chrome copy', () => {
  it('preserves the live NexusScope headline and waitlist CTA', () => {
    const en = getDict('en')
    expect(en.site.hero.title).toBe(
      'One incident. Three reporting regimes. Know which ones apply. Before the clock starts.',
    )
    expect(en.site.hero.subtitle).toMatch(/NIS2UmsuCG\/BSIG/)
    expect(en.site.hero.cta).toBe('Join waitlist')
    expect(en.site.hero.cta_secondary).toBe('View sample report')
    expect(en.site.faq.items[0].q).toMatch(/Does NIS2 \/ NISG \/ ISG apply/)
    expect(en.site.faq.items.length).toBeGreaterThanOrEqual(8)
    expect(en.site.proof.title).toMatch(/Designed for DACH organizations/)
    expect(en.site.proof.audiences).toContain('CISOs')
    expect(en.site.proof).not.toHaveProperty('placeholders')
    expect(en.site.footer.disclaimer).toMatch(/regulatory readiness intelligence/)
    expect(en.site.footer.tagline).toMatch(/Regulatory readiness intelligence/)
    expect(en.site.footer.operator_name).toBe('Noah Baumann')
    expect(en.site.footer.contact_email).toBe('hello@nexusscopes.com')
  })

  it('header exposes waitlist CTA when product is gated', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(<SiteHeader dict={dict} locale="en" productReady={false} />)
    expect(html).toContain('Join waitlist')
    expect(html).toContain('href="/#waitlist"')
    expect(html).not.toContain('Start free scan')
    expect(html).toContain('Features')
    expect(html).toContain('How it works')
    expect(html).toContain('Sample report')
    expect(html).toContain('FAQ')
    expect(html).toContain('Pricing')
    expect(html).toContain('href="/pricing"')
  })

  it('header exposes free-scan CTA when product-ready', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(<SiteHeader dict={dict} locale="en" productReady={true} />)
    expect(html).toContain('Start free scan')
    expect(html).toContain('href="/intake"')
  })

  it('sample report card shows independent IN/OUT/UNCLEAR stamps', () => {
    const dict = getDict('en')
    const report = buildSampleReport('mittelstand-de', 'en')
    const html = renderToStaticMarkup(<SampleReportCard report={report} dict={dict} />)
    expect(html).not.toContain('DEMO · SYNTHETIC')
    expect(html).not.toContain('DEMO · SYNTHETISCH')
    expect(html).toContain('NIS2UmsuCG')
    expect(html).toMatch(/regulatory readiness intelligence|not legal advice/i)
    expect(html).toContain('Confidence')
    expect(html).toContain('Next step')
    expect(html).toContain('Evidence')
    expect(html).toContain('Why:')
    expect(html).toContain('CONFIRMED')
    expect(html).toContain('DMARC record missing')
    expect(html).toContain('data-testid="sample-regime-mittelstand-de-de"')
    expect(html).toContain('data-testid="sample-confidence-mittelstand-de-de"')
    expect(html).toContain('data-testid="sample-regime-primary-mittelstand-de"')
    expect(html).toContain('data-testid="sample-regime-mittelstand-de-at"')
    expect(html).toContain('data-testid="sample-regime-mittelstand-de-ch"')
    expect(html).toContain('OUT')
  })

  it('keeps EN and DE landing copy aligned without dash separators', () => {
    const en = getDict('en')
    const de = getDict('de')
    expect(de.site.hero.title).toBe(
      'Ein Vorfall. Drei Melderegimes. Wissen Sie, welche gelten. Bevor die Frist läuft.',
    )
    expect(de.site.hero.cta_secondary).toBe('Musterbericht ansehen')
    const slices = [en, de].map((dict) =>
      JSON.stringify({
        hero: dict.site.hero,
        problem: dict.site.problem,
        how: dict.site.how,
        preview: {
          ...dict.site.preview,
          synthetic_badge: undefined,
        },
        features: dict.site.features,
        trust: dict.site.trust,
        waitlist: dict.site.waitlist,
        faq: dict.site.faq,
        proof: dict.site.proof,
        final_cta: dict.site.final_cta,
      }),
    )
    for (const blob of slices) {
      expect(blob).not.toMatch(/ — /)
      expect(blob).not.toMatch(/ – /)
    }
  })

  it('compact hero sample emphasises live status stamps, not demo badges', () => {
    const dict = getDict('en')
    const report = buildSampleReport('mittelstand-de', 'en')
    const html = renderToStaticMarkup(<SampleReportCard report={report} dict={dict} compact />)
    expect(html).not.toContain('DEMO · SYNTHETIC')
    expect(html).toContain('CONFIRMED')
    expect(html).toContain('OUT')
    expect(html).toContain('data-testid="sample-regime-primary-mittelstand-de"')
  })

  it('footer still lists imprint, privacy, contact and Switzerland / EU', () => {
    const html = renderToStaticMarkup(<SiteFooter dict={getDict('en')} locale="en" />)
    expect(html).toContain('href="/impressum"')
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('href="/pricing"')
    expect(html).toContain('href="/#features"')
    expect(html).toContain('href="/#how"')
    expect(html).toContain('href="/#preview"')
    expect(html).toContain('href="/#waitlist"')
    expect(html).toContain('href="/dpa"')
    expect(html).toContain('Switzerland / EU')
    expect(html).toContain('Regulatory readiness intelligence')
    expect(html).toContain('Noah Baumann')
    expect(html).toContain('hello@nexusscopes.com')
  })
})
