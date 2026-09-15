import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import NotFound from '@/app/not-found'

describe('not-found', () => {
  it('renders a static 404 without cookies() or URL env', () => {
    const html = renderToStaticMarkup(<NotFound />)
    expect(html).toContain('Page not found')
    expect(html).toContain('href="/"')
    expect(html).toContain('Back to NexusScope')
  })
})
