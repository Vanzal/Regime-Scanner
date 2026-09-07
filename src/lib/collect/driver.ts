import { Politeness, USER_AGENT, type PoliteResponse } from './politeness'

/**
 * Treiber-Interface für die Sammlung. Der Standard-Treiber ist `fetch` –
 * leichtgewichtig, überall verfügbar. Der Browser-Treiber ist bewusst ein
 * Stub: JS-gerenderte Seiten liefern in v1 nur einen `info`-Finding
 * („nicht einsehbar"); ein echtes Headless-Browser wäre eine zweite
 * Chromium-Kopie im Scan-Pfad → BACKLOG.
 */
export interface PageDriver {
  readonly id: 'fetch' | 'browser'
  get(url: string, gate: Politeness): Promise<PoliteResponse | null>
}

export const fetchDriver: PageDriver = {
  id: 'fetch',
  async get(url, gate) {
    return gate.get(url)
  },
}

/**
 * Browser-Treiber-Stub. Nur aktiv, wenn BROWSER_DRIVER_ENABLED=true UND ein
 * entsprechender Renderer verfügbar wäre – beides liefern wir bewusst noch
 * nicht; der Stub degradiert nachvollziehbar statt still zu scheitern.
 */
export const browserDriver: PageDriver = {
  id: 'browser',
  async get(url, gate) {
    const res = await gate.get(url)
    if (res && res.body && res.body.trim().length > 0) return res
    return { status: 0, headers: {}, body: null, note: 'js_required' }
  },
}

export function selectDriver(): PageDriver {
  return fetchDriver
}

export { USER_AGENT }
