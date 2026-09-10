import { describe, expect, it } from 'vitest'
import {
  LEGAL_DOCUMENT_ORDER,
  LEGAL_DOCUMENTS,
  footerLegalLinks,
  legalDocByHref,
} from '@/lib/legal/catalog'
import { loadLegalMarkdown, rewriteSiteUrls, stripOperatorNotes } from '@/lib/legal/load'
import { blocksText, parseMarkdown } from '@/lib/legal/parse'

describe('legal catalog (footer contract)', () => {
  it('exposes canonical paths the documents themselves use', () => {
    expect(LEGAL_DOCUMENTS.privacy.href).toBe('/privacy')
    expect(LEGAL_DOCUMENTS.terms.href).toBe('/legal/terms')
    expect(LEGAL_DOCUMENTS.dpa.href).toBe('/legal/dpa')
  })

  it('footerLegalLinks is locale-aware and stable for a later footer redesign', () => {
    expect(footerLegalLinks('en')).toEqual([
      { id: 'privacy', href: '/privacy', label: 'Privacy' },
      { id: 'terms', href: '/legal/terms', label: 'Terms' },
      { id: 'dpa', href: '/legal/dpa', label: 'DPA' },
    ])
    expect(footerLegalLinks('de').map((l) => l.label)).toEqual(['Datenschutz', 'AGB', 'AVV'])
    expect(LEGAL_DOCUMENT_ORDER).toEqual(['privacy', 'terms', 'dpa'])
  })

  it('resolves German and /legal aliases to the same documents', () => {
    expect(legalDocByHref('/datenschutz')?.id).toBe('privacy')
    expect(legalDocByHref('/legal/privacy')?.id).toBe('privacy')
    expect(legalDocByHref('/terms')?.id).toBe('terms')
    expect(legalDocByHref('/legal/terms')?.id).toBe('terms')
  })
})

describe('legal markdown publishing prep', () => {
  it('strips operator checklists and the unpublished callout', () => {
    const sample = [
      '# Title',
      '',
      '> **Note for the operator (delete before publishing):** do not ship this.',
      '',
      '---',
      '',
      '## 1. Summary',
      '',
      'Body.',
      '',
      '## Annex D — Operator checklist (internal — delete before publishing)',
      '',
      '1. Secret ops item.',
    ].join('\n')

    const published = stripOperatorNotes(sample)
    expect(published).toContain('## 1. Summary')
    expect(published).toContain('Body.')
    expect(published).not.toContain('Note for the operator')
    expect(published).not.toContain('Operator checklist')
    expect(published).not.toContain('Secret ops item')
  })

  it('rewrites nexusscopes.com links to site-relative paths', () => {
    const md = 'See the [DPA](https://nexusscopes.com/legal/dpa) and [https://nexusscopes.com/privacy].'
    expect(rewriteSiteUrls(md)).toBe('See the [DPA](/legal/dpa) and [/privacy](/privacy).')
  })
})

describe('published legal documents', () => {
  const docs = LEGAL_DOCUMENT_ORDER.map((id) => ({ id, markdown: loadLegalMarkdown(id) }))

  it.each(docs)('$id has no operator-only material', ({ markdown }) => {
    expect(markdown).not.toMatch(/Note for the operator/i)
    expect(markdown).not.toMatch(/Operator checklist/i)
    expect(markdown).not.toMatch(/delete before publishing/i)
  })

  it('privacy covers controller vs processor and data-subject rights', () => {
    const md = loadLegalMarkdown('privacy')
    const text = blocksText(parseMarkdown(md))
    expect(text).toMatch(/Privacy Policy/)
    expect(text).toMatch(/We are processor/)
    expect(text).toMatch(/right to be forgotten/i)
    expect(parseMarkdown(md).some((b) => b.type === 'table')).toBe(true)
    expect(md).toContain('](/legal/dpa)')
  })

  it('terms cover withdrawal, no-legal-advice, and incorporated documents', () => {
    const md = loadLegalMarkdown('terms')
    const text = blocksText(parseMarkdown(md))
    expect(text).toMatch(/Terms of Service/)
    expect(text).toMatch(/No legal advice/)
    expect(text).toMatch(/Right of withdrawal/)
    expect(text).toMatch(/Annex A/)
    expect(text).toMatch(/Annex B/)
    expect(text).not.toMatch(/Annex C/)
    expect(md).toContain('](/privacy)')
    expect(md).toContain('](/legal/dpa)')
  })

  it('dpa covers Art. 28 processing details and keeps operative annexes', () => {
    const md = loadLegalMarkdown('dpa')
    const text = blocksText(parseMarkdown(md))
    expect(text).toMatch(/Data Processing Agreement/)
    expect(text).toMatch(/Art\. 28/)
    expect(text).toMatch(/Annex I/)
    expect(text).toMatch(/Annex II/)
    expect(text).toMatch(/Annex III/)
    expect(text).toMatch(/Annex IV/)
    expect(text).not.toMatch(/Annex V/)
    expect(parseMarkdown(md).filter((b) => b.type === 'table').length).toBeGreaterThan(0)
    expect(md).toContain('](/legal/terms)')
    expect(md).toContain('](/privacy)')
  })

  it('parser turns GFM tables and emphasis into structured blocks', () => {
    const md = [
      '# Heading',
      '',
      'A **bold** and *italic* and [link](/privacy).',
      '',
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
    ].join('\n')
    const blocks = parseMarkdown(md)
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 1 })
    expect(blocks[1]?.type).toBe('paragraph')
    expect(blocks[2]).toMatchObject({
      type: 'table',
      headers: [[{ type: 'text', value: 'A' }], [{ type: 'text', value: 'B' }]],
    })
  })
})
