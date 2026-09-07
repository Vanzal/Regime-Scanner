import type {
  Applicable,
  DeadlineInfo,
  RegimeVerdict,
  SizeInterval,
  ThresholdTrace,
  TraceEntry,
  VerdictFacts,
} from './types'
import type { Bounds, EntityClass, RulesFile } from './schema'

type Status = 'pass' | 'fail' | 'undetermined' | 'skipped' | 'fired'

/** EU-27 (Niederlassungsbegriff für die Indirekt-Betrachtung) */
const EU_MEMBERS = new Set([
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu',
  'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se',
])

export function isEu(country: string): boolean {
  return EU_MEMBERS.has(country.toLowerCase())
}

/**
 * Einzelnes Merkmal gegen eine Schranke prüfen.
 * employees: "mindestens" (>=) · Geldwerte: "über" (>)
 * Unknown-Intervalle liefern 'undetermined' – die Engine errät nie.
 */
function evalBound(metric: SizeInterval | undefined, bound: number, cmp: 'gte' | 'gt'): Status {
  if (!metric) return 'undetermined'
  if (metric.min !== undefined) {
    const passes = cmp === 'gte' ? metric.min >= bound : metric.min > bound
    if (passes) return 'pass'
  }
  if (metric.max !== undefined) {
    const fails = cmp === 'gte' ? metric.max < bound : metric.max <= bound
    if (fails) return 'fail'
  }
  return 'undetermined'
}

function evalFlag(flag: boolean | undefined, label: string, entries: TraceEntry[]): Status {
  if (flag === undefined) {
    entries.push({ kind: 'bound', label, status: 'undetermined', detail: 'Angabe fehlt' })
    return 'undetermined'
  }
  entries.push({ kind: 'bound', label, status: flag ? 'pass' : 'fail' })
  return flag ? 'pass' : 'fail'
}

function combineAnd(statuses: Status[]): Status {
  if (statuses.includes('fail')) return 'fail'
  if (statuses.includes('undetermined')) return 'undetermined'
  return 'pass'
}

function combineOr(statuses: Status[]): Status {
  if (statuses.includes('pass')) return 'pass'
  if (statuses.includes('undetermined')) return 'undetermined'
  return 'fail'
}

function evalCondition(bounds: Bounds, facts: VerdictFacts, idx: number, entries: TraceEntry[]): Status {
  const label = `Bedingung ${idx + 1}`
  const statuses: Status[] = []
  if (bounds.employees_min !== undefined) {
    const s = evalBound(facts.employees, bounds.employees_min, 'gte')
    entries.push({
      kind: 'bound',
      label: `Mitarbeitende ≥ ${bounds.employees_min}`,
      status: s,
      detail: fmtInterval(facts.employees),
    })
    statuses.push(s)
  }
  if (bounds.revenue_eur_min !== undefined) {
    const s = evalBound(facts.revenueEur, bounds.revenue_eur_min, 'gt')
    entries.push({
      kind: 'bound',
      label: `Jahresumsatz > ${fmtEur(bounds.revenue_eur_min)}`,
      status: s,
      detail: fmtInterval(facts.revenueEur),
    })
    statuses.push(s)
  }
  if (bounds.balance_eur_min !== undefined) {
    const s = evalBound(facts.balanceEur, bounds.balance_eur_min, 'gt')
    entries.push({
      kind: 'bound',
      label: `Jahresbilanzsumme > ${fmtEur(bounds.balance_eur_min)}`,
      status: s,
      detail: fmtInterval(facts.balanceEur),
    })
    statuses.push(s)
  }
  if (bounds.requires_critical_designation !== undefined) {
    statuses.push(evalFlag(facts.designatedCritical, 'Amtliche Einstufung als kritische Infrastruktur/kritische Anlage', entries))
  }
  if (bounds.requires_qualified_trust_service !== undefined) {
    statuses.push(evalFlag(facts.qualifiedTrustService, 'Qualifizierter Vertrauensdiensteanbieter (eIDAS)', entries))
  }
  const result = combineAnd(statuses)
  entries.push({ kind: 'condition', label, status: result })
  return result
}

/** Eine Klasse erfüllt, wenn SECTOR passt UND (eine Bedingung ODER-erfüllt). */
function evalClass(cls: EntityClass, facts: VerdictFacts, entries: TraceEntry[]): Status {
  if (cls.sectors && (!facts.sector || !cls.sectors.includes(facts.sector))) {
    entries.push({ kind: 'class', label: cls.label, status: 'skipped', detail: 'Sektor passt nicht' })
    return 'skipped'
  }
  const condStatuses = (cls.conditions ?? []).map((c, i) => evalCondition(c, facts, i, entries))
  const status = cls.conditions === undefined ? 'pass' : combineOr(condStatuses)
  entries.push({ kind: 'class', label: cls.label, status: status === 'skipped' ? 'fail' : status, detail: cls.note })
  return status
}

function collectMissing(entries: TraceEntry[]): string[] {
  return entries
    .filter((e) => e.status === 'undetermined')
    .map((e) => e.label)
}

function fmtInterval(i?: SizeInterval): string {
  if (!i) return 'unbekannt'
  const parts: string[] = []
  if (i.min !== undefined) parts.push(`≥ ${i.min.toLocaleString('de-DE')}`)
  if (i.max !== undefined) parts.push(`≤ ${i.max.toLocaleString('de-DE')}`)
  return parts.length ? parts.join(' und ') : 'unbekannt'
}

function fmtEur(n: number): string {
  return `${(n / 1_000_000).toLocaleString('de-DE')} Mio €`
}

function buildVerdict(
  file: RulesFile,
  facts: VerdictFacts,
  applicable: Applicable,
  confidence: number,
  reasoningMd: string,
  entries: TraceEntry[],
  missing: string[],
): RegimeVerdict {
  const deadlines: DeadlineInfo = {
    stages: file.reporting_clock.stages.map((s) => ({ key: s.key, hours: s.hours })),
    authority: file.reporting_clock.authority,
  }
  const trace: ThresholdTrace = { entries, missing_inputs: [...new Set(missing)] }
  return {
    regime: file.regime,
    lawName: file.law_name,
    applicable,
    confidence,
    reasoningMd,
    thresholdTrace: trace,
    deadlines,
    rulesVersionLabel: file.version_label,
    effectiveFrom: file.effective_from,
  }
}

function reasonEstablished(file: RulesFile, facts: VerdictFacts): string {
  const where = file.applicability_country.toUpperCase()
  if (facts.countryHq === file.applicability_country) {
    return `Der Hauptsitz liegt in ${where}; das ${file.law_name} ist örtlich anwendbar.`
  }
  const sub = facts.subsidiaries.find((s) => s.country === file.applicability_country)
  return `Niederlassung in ${where} bekannt${sub?.name ? ` (${sub.name})` : ''}; das ${file.law_name} ist damit örtlich anwendbar.`
}

/**
 * Generischer Auswerter: ein Regime, ein Urteil. Kein Regime-Konstanten-Wissen im Code –
 * alles Rechtliche kommt aus der YAML-Datei.
 */
export function evaluateRegime(file: RulesFile, facts: VerdictFacts): RegimeVerdict {
  const entries: TraceEntry[] = []
  const missing: string[] = []

  // 1) Örtliche Anwendbarkeit (Niederlassungs-Prinzip)
  const established =
    facts.countryHq === file.applicability_country ||
    facts.subsidiaries.some((s) => s.country === file.applicability_country)
  entries.push({
    kind: 'establishment',
    label: `Niederlassung im Anwendungsgebiet (${file.applicability_country.toUpperCase()})`,
    status: established ? 'pass' : 'fail',
    detail: facts.countryHq ? `Hauptsitz: ${facts.countryHq.toUpperCase()}` : 'Hauptsitz unbekannt',
  })
  if (!established) {
    const verdict = buildVerdict(
      file, facts, 'not_applicable', 0.9,
      `Es ist keine Niederlassung in ${file.applicability_country.toUpperCase()} bekannt – Hauptsitz: ${(facts.countryHq ?? 'unbekannt').toUpperCase()}. Das ${file.law_name} ist damit nicht direkt anwendbar.`,
      entries, missing,
    )
    return applyIndirectExposure(file, facts, verdict)
  }

  // 2) Sektor
  if (!facts.sector || facts.sector === 'unknown') {
    missing.push('Branche')
    entries.push({ kind: 'sector', label: 'Branche', status: 'undetermined', detail: 'keine Angabe' })
    return buildVerdict(
      file, facts, 'unclear', 0.5,
      `Die Branche wurde nicht angegeben. Der Anwendungsbereich des ${file.law_name} ist sektorabhängig – bitte Branche ergänzen, um eine verbindliche Aussage zu erhalten.`,
      entries, missing,
    )
  }
  entries.push({ kind: 'sector', label: `Branche: ${facts.sector}`, status: 'pass' })

  // 3) Entitätsklassen in YAML-Reihenfolge (Priorität) auswerten
  let anyUndetermined = false
  for (const cls of file.entity_classes) {
    const status = evalClass(cls, facts, entries)
    if (status === 'pass') {
      const applicable: Applicable = cls.outcome === 'unclear' ? 'unclear' : 'applicable'
      const confidence = cls.outcome === 'unclear' ? 0.6 : 0.9
      const reason = `${reasonEstablished(file, facts)} Einordnung: **${cls.label}** – die Voraussetzungen sind nach den vorliegenden Angaben erfüllt.${cls.note ? ` Hinweis: ${cls.note}` : ''}`
      return buildVerdict(file, facts, applicable, confidence, reason, entries, missing)
    }
    if (status === 'undetermined') anyUndetermined = true
  }

  // 4) Sektor passt, aber keine Klasse erfüllt
  if (anyUndetermined) {
    const undetermined = collectMissing(entries)
    missing.push(...undetermined)
    return buildVerdict(
      file, facts, 'unclear', 0.5,
      `Die Branche fällt in den Anwendungsbereich des ${file.law_name}, die Einordnung kann aber nicht abschließend getroffen werden, weil folgende Angaben fehlen: ${undetermined.join(', ') || 'unbekannt'}. Bitte ergänzen – die Engine errät keine Schwellenwerte.`,
      entries, missing,
    )
  }

  const below = file.below_threshold ?? {
    outcome: 'unclear' as const,
    note: 'Schwellenwerte nicht erreicht; manuelle Prüfung empfohlen.',
  }
  const verdict = buildVerdict(
    file, facts, below.outcome, below.outcome === 'not_applicable' ? 0.8 : 0.5,
    `Die Branche ist grundsätzlich einschlägig, aber die Schwellenwerte werden nach den vorliegenden Angaben nicht erreicht. ${below.note}`,
    entries, missing,
  )
  return applyIndirectExposure(file, facts, verdict)
}

/**
 * CH-Zweig als generischer Mechanismus: Nur wenn eine Regeldatei
 * `indirect_exposure` deklariert, werden Faktoren ausgewertet. Die juristische
 * Bewertung (welche Faktoren zählen) steht in der YAML, die Mechanik hier.
 */
function applyIndirectExposure(file: RulesFile, facts: VerdictFacts, verdict: RegimeVerdict): RegimeVerdict {
  const indirect = file.indirect_exposure
  if (!indirect || verdict.applicable !== 'not_applicable') return verdict

  const entries = [...verdict.thresholdTrace.entries]
  const missing = [...verdict.thresholdTrace.missing_inputs]
  let fired: string[] = []
  let undetermined: string[] = []

  for (const factor of indirect.factors) {
    let status: Status
    switch (factor.id) {
      case 'eu_subsidiary': {
        const euSub = facts.subsidiaries.find((s) => isEu(s.country))
        status = euSub ? 'fired' : 'fail'
        entries.push({
          kind: 'factor', label: factor.label, status: euSub ? 'fired' : 'fail',
          detail: euSub?.name ? `EU-Tochter: ${euSub.name} (${euSub.country.toUpperCase()})` : 'keine EU-Tochter bekannt',
        })
        break
      }
      case 'eu_customers_contract': {
        const v = facts.euCustomersWithSecurityClauses
        status = v === 'yes' ? 'fired' : v === 'unknown' ? 'undetermined' : 'fail'
        entries.push({
          kind: 'factor', label: factor.label, status,
          detail: v === 'yes' ? 'EU-Kunden mit vertraglichen Sicherheitsanforderungen' : v === 'unknown' ? 'Angabe fehlt' : 'nicht gegeben',
        })
        break
      }
      case 'supply_chain_critical': {
        const v = facts.supplyChainCritical
        status = v === true ? 'fired' : v === undefined ? 'undetermined' : 'fail'
        entries.push({
          kind: 'factor', label: factor.label, status,
          detail: v === true ? 'Position in kritischer Lieferkette' : v === undefined ? 'Angabe fehlt' : 'nicht gegeben',
        })
        break
      }
      default:
        status = 'undetermined'
        entries.push({ kind: 'factor', label: factor.label, status, detail: `Faktor „${factor.id}“ nicht auswertbar` })
    }
    if (status === 'fired') fired.push(factor.label)
    if (status === 'undetermined') undetermined.push(factor.label)
    if (factor.note && status !== 'fail') missing.push(factor.label)
  }

  if (fired.length > 0 || undetermined.length > 0) {
    return {
      ...verdict,
      applicable: 'unclear',
      confidence: 0.4,
      reasoningMd: `Die direkte Meldepflicht nach dem ${file.law_name} greift nach vorliegenden Angaben nicht. ${indirect.label} ${[...fired, ...undetermined].join('; ')} begründen/erfordern jedoch eine Einzelfallprüfung – die Einordnung bleibt daher bewusst „unklar“${undetermined.length ? ' (Angaben ergänzen)' : ''}.`,
      thresholdTrace: { entries, missing_inputs: [...new Set(missing)] },
    }
  }
  return {
    ...verdict,
    reasoningMd: `${verdict.reasoningMd} ${indirect.label} Direkte wie indirekte Betroffenheit wurden geprüft; nach vorliegenden Angaben besteht keine Meldepflicht.`,
    thresholdTrace: { entries, missing_inputs: [...new Set(missing)] },
  }
}

/** Alle Regime-Fassungen unabhängig voneinander auswerten – niemals zusammenfassen. */
export function evaluateAll(files: RulesFile[], facts: VerdictFacts): RegimeVerdict[] {
  return files.map((f) => evaluateRegime(f, facts))
}
