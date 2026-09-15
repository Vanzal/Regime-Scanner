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

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', setTheme: vi.fn() }),
}))

describe('marketing chrome copy', () => {
  it('preserves the live NexusScope headline and early-access CTA', () => {
    const en = getDict('en')
    expect(en.site.hero.title).toBe(
      'One incident. Three reporting regimes. Know which ones apply — before the clock starts.',
    )
    expect(en.site.hero.subtitle).toMatch(/NIS2UmsuCG, NISG 2024 and the Swiss ISG/)
    expect(en.site.hero.cta).toBe('Get early access')
    expect(en.site.hero.cta_secondary).toBe('See an example report')
    expect(en.site.faq.items[0].q).toMatch(/Does NIS2 \/ NISG \/ ISG apply/)
    expect(en.site.faq.items.length).toBeGreaterThanOrEqual(8)
    expect(en.site.footer.tagline).toMatch(/Regulatory readiness intelligence/)
  })

  it('header exposes early-access CTA when product is gated', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(<SiteHeader dict={dict} locale="en" productReady={false} />)
    expect(html).toContain('Get early access')
    expect(html).toContain('href="/#waitlist"')
    expect(html).not.toContain('Run a readiness check')
    expect(html).toContain('Features')
    expect(html).toContain('How it works')
    expect(html).toContain('Sample report')
    expect(html).toContain('FAQ')
  })

  it('header exposes readiness-check CTA when product-ready', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(<SiteHeader dict={dict} locale="en" productReady={true} />)
    expect(html).toContain('Run a readiness check')
    expect(html).toContain('href="/intake"')
  })

  it('sample report card shows independent IN/OUT/UNCLEAR stamps', () => {
    const dict = getDict('en')
    const report = buildSampleReport('mittelstand-de')
    const html = renderToStaticMarkup(<SampleReportCard report={report} dict={dict} />)
    expect(html).toContain('SYNTHETIC')
    expect(html).toContain('NIS2UmsuCG')
    expect(html).toContain('not legal advice')
    expect(html).toContain('data-testid="sample-regime-mittelstand-de-de"')
    expect(html).toContain('Why?')
    expect(html).toContain('View evidence')
    expect(html).toContain('Confidence')
  })

  it('footer still lists imprint, privacy, contact and Switzerland / EU', () => {
    const html = renderToStaticMarkup(<SiteFooter dict={getDict('en')} locale="en" />)
    expect(html).toContain('href="/impressum"')
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('href="/pricing"')
    expect(html).toContain('href="/#how"')
    expect(html).toContain('href="/#preview"')
    expect(html).toContain('href="/#waitlist"')
    expect(html).toContain('Switzerland / EU')
    expect(html).toContain('Regulatory readiness intelligence')
  })
})
