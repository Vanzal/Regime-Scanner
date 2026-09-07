// Netlify-Funktion: Bericht als PDF ausliefern.
// Bewusst eigenständig (relative Imports, kein @/-Alias): standalone Functions
// erben die tsconfig-Pfade des Next-Builds nicht zuverlässig.
// Rendered dieselbe Route (?print=1) → der PDF-Inhalt ist per Konstruktion
// inhaltsgleich zur Web-Ansicht.
import type { Config } from '@netlify/functions'
import puppeteer from 'puppeteer-core'

export default async (req: Request) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response('Ungültiger Token', { status: 400 })
  }

  const base = process.env.SITE_URL ?? url.origin
  const target = `${base}/report/${token}?print=1`

  try {
    const chromium = (await import('@sparticuz/chromium')).default
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
    try {
      const page = await browser.newPage()
      await page.goto(target, { waitUntil: 'networkidle0', timeout: 20_000 })
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
      })
      return new Response(pdf as unknown as BodyInit, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `inline; filename="regime-radar-bericht.pdf"`,
          'cache-control': 'no-store',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.error('[render-pdf]', err)
    // Graziös ausweichen: die Print-Ansicht funktioniert überall.
    return Response.redirect(target, 302)
  }
}

export const config: Config = {
  // A4-Render mit Chromium bleibt meist unter 15 s; Limit im netlify.toml: 26 s.
  timeout: 26,
}
