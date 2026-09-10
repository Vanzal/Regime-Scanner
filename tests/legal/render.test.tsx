import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { FooterLegalNav } from '@/components/site/site-footer'
import { LegalMarkdown } from '@/lib/legal/render'
import { loadLegalMarkdown } from '@/lib/legal/load'
import { getDict } from '@/i18n'

describe('legal pages render', () => {
  it('footer emits catalog hrefs for privacy, terms, and DPA', () => {
    const html = renderToString(<FooterLegalNav dict={getDict('en')} locale="en" />)
    expect(html).toContain('href="/impressum"')
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/legal/terms"')
    expect(html).toContain('href="/legal/dpa"')
    expect(html).toContain('data-testid="footer-legal-privacy"')
    expect(html).toContain('data-testid="footer-legal-terms"')
    expect(html).toContain('data-testid="footer-legal-dpa"')
  })

  it('privacy markdown renders tables and internal DPA link', () => {
    const html = renderToString(<LegalMarkdown markdown={loadLegalMarkdown('privacy')} />)
    expect(html).toContain('<h1>')
    expect(html).toContain('<table>')
    expect(html).toContain('href="/legal/dpa"')
    expect(html).not.toContain('Operator checklist')
  })

  it('terms markdown renders the model withdrawal form', () => {
    const html = renderToString(<LegalMarkdown markdown={loadLegalMarkdown('terms')} />)
    expect(html).toContain('withdraw from the contract')
    expect(html).toContain('<blockquote')
  })

  it('dpa markdown renders Annex III sub-processor table', () => {
    const html = renderToString(<LegalMarkdown markdown={loadLegalMarkdown('dpa')} />)
    expect(html).toContain('Authorised Sub-processors')
    expect(html).toContain('<th')
    expect(html).toContain('Transfer mechanism')
  })
})
