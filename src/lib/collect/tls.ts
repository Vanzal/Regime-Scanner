import tls from 'node:tls'

export interface TlsInfo {
  connectable: boolean
  protocol?: string
  cipher?: string
  authorized?: boolean
  issuer?: string
  valid_to?: string
  days_until_expiry?: number
  error?: string
}

export interface TlsCollector {
  /** Ein einzelner TLS-Handshake :443 mit SNI – gecacht pro Host, kein Port-Scanning. */
  inspect(host: string): Promise<TlsInfo>
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return Number.NaN
  return Math.floor((d.getTime() - Date.now()) / 86_400_000)
}

/**
 * Genau EIN Verbindungsversuch zu :443 mit SNI – das ist kein Port-Scan,
 * sondern derselbe Handshake wie beim Besuch der Seite im Browser.
 */
export function createTlsCollector(timeoutMs = 10_000): TlsCollector {
  const cache = new Map<string, TlsInfo>()
  return {
    async inspect(host) {
      const cached = cache.get(host)
      if (cached) return cached
      const info = await new Promise<TlsInfo>((resolve) => {
        let settled = false
        const finish = (v: TlsInfo) => {
          if (!settled) {
            settled = true
            resolve(v)
          }
        }
        try {
          const socket = tls.connect(
            {
              host,
              port: 443,
              servername: host,
              timeout: timeoutMs,
              rejectUnauthorized: false, // wir wollen das Zertifikat inspizieren, nicht ablehnen
            },
            () => {
              const cert = socket.getPeerCertificate()
              const info: TlsInfo = {
                connectable: true,
                protocol: socket.getProtocol() ?? undefined,
                cipher: socket.getCipher()?.name,
                authorized: socket.authorized,
                issuer: typeof cert.issuer === 'object' ? String(cert.issuer.O ?? cert.issuer.CN ?? '') || undefined : undefined,
                valid_to: typeof cert.valid_to === 'string' ? cert.valid_to : undefined,
                days_until_expiry: cert.valid_to ? daysUntil(cert.valid_to) : undefined,
              }
              socket.end()
              finish(info)
            },
          )
          socket.on('error', (err) => finish({ connectable: false, error: err.message }))
          socket.on('timeout', () => {
            socket.destroy()
            finish({ connectable: false, error: 'timeout' })
          })
        } catch (err) {
          finish({ connectable: false, error: err instanceof Error ? err.message : String(err) })
        }
      })
      cache.set(host, info)
      return info
    },
  }
}
