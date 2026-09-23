import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDict } from '@/i18n'
import { EnterForm } from '@/app/enter/enter-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('enter form', () => {
  it('renders the private-preview password form', () => {
    const dict = getDict('en')
    const html = renderToStaticMarkup(
      <EnterForm
        next="/pricing"
        locale="en"
        langLabel={dict.site.footer.lang_label}
        themeLabel={dict.site.theme.toggle}
        title={dict.site.gate.title}
        body={dict.site.gate.body}
        placeholder={dict.site.gate.placeholder}
        submit={dict.site.gate.submit}
        error={dict.site.gate.error}
      />,
    )
    expect(html).toContain('Private preview')
    expect(html).toContain('password-protected')
    expect(html).toContain('name="password"')
    expect(html).toContain('name="next"')
    expect(html).toContain('value="/pricing"')
    expect(html).toContain('Enter site')
    expect(html).toContain('NexusScope')
  })

  it('keeps EN and DE gate copy aligned without dash separators', () => {
    const en = getDict('en').site.gate
    const de = getDict('de').site.gate
    expect(Object.keys(en)).toEqual(Object.keys(de))
    expect(de.title).toBe('Geschützte Vorschau')
    expect(de.submit).toBe('Zur Website')
    for (const blob of [JSON.stringify(en), JSON.stringify(de)]) {
      expect(blob).not.toMatch(/ — /)
      expect(blob).not.toMatch(/ – /)
    }
  })
})
