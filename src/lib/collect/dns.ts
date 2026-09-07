import { Resolver } from 'node:dns/promises'

export interface DnsCollector {
  /** TXT-Records eines Namens (Liste von Strings, je Record verkettet). */
  txt(name: string): Promise<string[]>
  /** IPv4/IPv6-Adressen eines Hostnamens (leer, wenn nicht auflösbar). */
  addresses(name: string): Promise<string[]>
  /** MX-Einträge (Priorität, Austauscher). */
  mx(name: string): Promise<Array<{ priority: number; exchange: string }>>
}

/**
 * DNS über den nativen Resolver – läuft komplett ohne HTTP gegen das Ziel
 * (die Höflichkeits-Gate zählt nur HTTP-Requests; DNS-Abfragen sind
 * kein Site-Traffic). Fehler → leere Ergebnisse, die Checks daraus
 * transparente Findings machen.
 */
export function createDnsCollector(): DnsCollector {
  const resolver = new Resolver()
  // Öffentliche Resolver als Fallback, falls die Systemkonfiguration mau ist
  try {
    resolver.setServers(['1.1.1.1', '8.8.8.8'])
  } catch {
    // System-Standard bleibt
  }

  return {
    async txt(name) {
      try {
        const records = await resolver.resolveTxt(name)
        return records.map((chunks) => chunks.join(''))
      } catch {
        return []
      }
    },
    async addresses(name) {
      try {
        return await resolver.resolve4(name)
      } catch {
        return []
      }
    },
    async mx(name) {
      try {
        const records = await resolver.resolveMx(name)
        return records.map((r) => ({ priority: r.priority, exchange: r.exchange }))
      } catch {
        return []
      }
    },
  }
}
