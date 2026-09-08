import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { RulesFileSchema, type RulesFile } from './schema'

let cache: RulesFile[] | null = null
let cacheAll: RulesFile[] | null = null

/** Das rules/-Verzeichnis finden – im Next-Runtime und in Standalone-Funktionen. */
export function resolveRulesDir(): string {
  const candidates = [
    path.join(process.cwd(), 'rules'),
    path.join(process.cwd(), '..', 'rules'),
    path.join(process.cwd(), '..', '..', 'rules'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c
  }
  throw new Error('rules/-Verzeichnis nicht gefunden (candidates: cwd/rules, cwd/../rules)')
}

/** `v12` → 12. Non-matching strings sort as 0. */
export function versionNumber(version: string): number {
  const m = /^v(\d+)$/.exec(version)
  return m ? Number(m[1]) : 0
}

/**
 * Pro Regime nur die höchste `version` behalten. Macht parallele v1/v2-Dateien
 * im rules/-Ordner sicher – neue Regime-Versionen = neue Datei, ohne Doppel-Urteile.
 */
export function selectLatestByRegime(files: RulesFile[]): RulesFile[] {
  const best = new Map<string, RulesFile>()
  for (const f of files) {
    const prev = best.get(f.regime)
    if (!prev || versionNumber(f.version) > versionNumber(prev.version)) {
      best.set(f.regime, f)
    }
  }
  return [...best.values()].sort((a, b) => a.regime.localeCompare(b.regime))
}

function readAndValidate(base: string): RulesFile[] {
  const names = fs
    .readdirSync(base)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
  const loaded = names.map((f) => {
    const raw = parse(fs.readFileSync(path.join(base, f), 'utf8'))
    const parsed = RulesFileSchema.safeParse(raw)
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Regeldatei ${f} verletzt das Schema: ${issues}`)
    }
    return parsed.data
  })
  if (loaded.length === 0) throw new Error(`Keine Regeldateien in ${base} gefunden`)
  return loaded
}

/**
 * Alle Regime-Fassungen laden und validieren (nur neueste Version je Regime).
 * Fail-fast bei Schema-Verletzung.
 */
export function loadRules(dir?: string, force = false): RulesFile[] {
  if (cache && !force && dir === undefined) return cache
  const base = dir ?? resolveRulesDir()
  const loaded = selectLatestByRegime(readAndValidate(base))
  if (dir === undefined) cache = loaded
  return loaded
}

/**
 * Alle Dateiversionen laden (inkl. älterer vN). Nützlich für Audits /
 * rules_versions-Seeding – die Engine selbst nutzt `loadRules`.
 */
export function loadAllRuleVersions(dir?: string, force = false): RulesFile[] {
  if (cacheAll && !force && dir === undefined) return cacheAll
  const base = dir ?? resolveRulesDir()
  const loaded = readAndValidate(base)
  if (dir === undefined) cacheAll = loaded
  return loaded
}

/** Für Tests: eine einzelne Datei laden und validieren. */
export function loadRulesFile(filePath: string): RulesFile {
  const raw = parse(fs.readFileSync(filePath, 'utf8'))
  const parsed = RulesFileSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Regeldatei ${filePath} verletzt das Schema: ${issues}`)
  }
  return parsed.data
}
