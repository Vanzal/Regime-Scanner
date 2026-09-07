import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { RulesFileSchema, type RulesFile } from './schema'

let cache: RulesFile[] | null = null

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

/** Alle Regime-Fassungen laden und validieren. Fail-fast bei Schema-Verletzung. */
export function loadRules(dir?: string, force = false): RulesFile[] {
  if (cache && !force && dir === undefined) return cache
  const base = dir ?? resolveRulesDir()
  const files = fs
    .readdirSync(base)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
  const loaded = files.map((f) => {
    const raw = parse(fs.readFileSync(path.join(base, f), 'utf8'))
    const parsed = RulesFileSchema.safeParse(raw)
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Regeldatei ${f} verletzt das Schema: ${issues}`)
    }
    return parsed.data
  })
  if (loaded.length === 0) throw new Error(`Keine Regeldateien in ${base} gefunden`)
  if (dir === undefined) cache = loaded
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
