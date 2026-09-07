import { after } from 'next/server'

/**
 * Scan-Auslösung, hosting-portabel:
 * - lokale Entwicklung → `after()` im gleichen Prozess (Next-Dev-Server);
 * - Produktion/Netlify → fire-and-forget POST an den Hintergrund-Runner
 *   (netlify/functions/scan-runner.background.mts, durch SCAN_RUNNER_SECRET
 *   geschützt); auf Vercel funktioniert derselbe Aufruf gegen /api/scan-run.
 */
export function triggerScan(scanId: string): void {
  const secret = process.env.SCAN_RUNNER_SECRET
  const isProd = process.env.NODE_ENV === 'production'
  const runnerUrl = process.env.SCAN_RUNNER_URL // überschreibbar (z. B. Vercel: /api/scan-run)

  if (isProd && secret) {
    const base = process.env.SITE_URL ?? ''
    const url = `${base}${runnerUrl ?? '/.netlify/functions/scan-runner.background'}`
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-scan-runner-secret': secret },
      body: JSON.stringify({ scan_id: scanId }),
    }).catch(() => {
      // Hintergrund-Fehler sichtbar machen, ohne die Response zu blockieren
      console.error(`[triggerScan] Runner-Aufruf fehlgeschlagen für ${scanId}`)
    })
    return
  }

  after(async () => {
    const { runScan } = await import('./pipeline')
    try {
      await runScan(scanId)
    } catch (err) {
      console.error(`[runScan ${scanId}]`, err)
    }
  })
}
