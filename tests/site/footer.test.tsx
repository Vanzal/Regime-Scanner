import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDict } from '@/i18n'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import { SiteFooter } from '@/components/site/site-footer'

describe('SiteFooter', () => {
  it('renders Swiss/EU imprint essentials and legal routes (EN)', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(<SiteFooter dict={dict} locale="en" />)

    expect(html).toContain('data-testid="site-footer"')
    expect(html).toContain('NexusScope')
    expect(html).toContain('Switzerland')
    expect(html).toContain('hello@nexusscope.example')
    expect(html).toContain('CHE-XXX.XXX.XXX')
    expect(html).toContain('© 2026 NexusScope')
    expect(html).toContain('does not constitute legal advice')
    expect(html).toContain('Data is processed in Switzerland / EU.')
    expect(html).toContain('href="/impressum"')
    expect(html).toContain('href="/datenschutz"')
    expect(html).toContain('href="/terms"')
    expect(html).toContain('href="/cookies"')
    expect(html).toContain('Cookie Settings')
  })

  it('renders bilingual DE labels and disclaimer', () => {
    const dict = getDict('de')
    const html = renderToStaticMarkup(<SiteFooter dict={dict} locale="de" />)

    expect(html).toContain('Impressum')
    expect(html).toContain('Datenschutz')
    expect(html).toContain('Nutzungsbedingungen')
    expect(html).toContain('Cookie-Richtlinie')
    expect(html).toContain('keine Rechtsberatung')
    expect(html).toContain('Schweiz / EU')
  })
})
