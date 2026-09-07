import fs from 'node:fs'
import path from 'node:path'

export interface FixtureScan {
  slug: string
  company: { legal_name: string; domain: string; country_hq: string; sector_nace?: string }
  intake: Record<string, unknown>
  findings: Array<{
    check_id: string
    severity: 'info' | 'low' | 'med' | 'high'
    title: string
    detail: string
    fix?: string
    control_refs: string[]
    evidence_json: Record<string, unknown>
    source_url?: string
  }>
}

let cache: FixtureScan[] | null = null

function fixturesDir(): string {
  const candidates = [
    path.join(process.cwd(), 'fixtures', 'scans'),
    path.join(process.cwd(), '..', 'fixtures', 'scans'),
    path.join(process.cwd(), '..', '..', 'fixtures', 'scans'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[0]
}

/** Vorab gesammelte Demo-Scans – identisch zum Live-Pfad, nur ohne Netzaufrufe. */
export function loadFixtures(): FixtureScan[] {
  if (cache) return cache
  const dir = fixturesDir()
  cache = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as FixtureScan)
  return cache
}

export function findFixtureByDomain(domain: string): FixtureScan | null {
  const d = domain.toLowerCase()
  return loadFixtures().find((f) => f.company.domain.toLowerCase() === d) ?? null
}
