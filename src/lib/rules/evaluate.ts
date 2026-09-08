import type {
  Applicable,
  DeadlineInfo,
  IncidentSignals,
  IncidentTriggerInfo,
  IncidentTriggerMatch,
  MissingInput,
  RegimeVerdict,
  SizeInterval,
  ThresholdTrace,
  TraceEntry,
  UnclearCode,
  VerdictFacts,
} from './types'
import type {
  Bounds,
  EntityClass,
  FactorWhen,
  IncidentTrigger,
  IndirectFactor,
  RulesFile,
} from './schema'

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

function evalFlag(
  flag: boolean | undefined,
  label: string,
  code: string,
  inputKey: string,
  entries: TraceEntry[],
): Status {
  if (flag === undefined) {
    entries.push({
      kind: 'bound',
      label,
      status: 'undetermined',
      detail: 'Angabe fehlt',
      code,
      input_key: inputKey,
    })
    return 'undetermined'
  }
  entries.push({ kind: 'bound', label, status: flag ? 'pass' : 'fail', code, input_key: inputKey })
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

function evalCondition(
  bounds: Bounds,
  facts: VerdictFacts,
  idx: number,
  classId: string,
  entries: TraceEntry[],
): Status {
  const label = `Bedingung ${idx + 1}`
  const statuses: Status[] = []
  if (bounds.employees_min !== undefined) {
    const s = evalBound(facts.employees, bounds.employees_min, 'gte')
    entries.push({
      kind: 'bound',
      label: `Mitarbeitende ≥ ${bounds.employees_min}`,
      status: s,
      detail: fmtInterval(facts.employees),
      code: `bound.employees_min:${bounds.employees_min}`,
      class_id: classId,
      input_key: 'employees',
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
      code: `bound.revenue_eur_min:${bounds.revenue_eur_min}`,
      class_id: classId,
      input_key: 'revenue_eur',
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
      code: `bound.balance_eur_min:${bounds.balance_eur_min}`,
      class_id: classId,
      input_key: 'balance_eur',
    })
    statuses.push(s)
  }
  if (bounds.requires_critical_designation !== undefined) {
    statuses.push(
      evalFlag(
        facts.designatedCritical,
        'Amtliche Einstufung als kritische Infrastruktur/kritische Anlage',
        'bound.requires_critical_designation',
        'designated_critical',
        entries,
      ),
    )
  }
  if (bounds.requires_qualified_trust_service !== undefined) {
    statuses.push(
      evalFlag(
        facts.qualifiedTrustService,
        'Qualifizierter Vertrauensdiensteanbieter (eIDAS)',
        'bound.requires_qualified_trust_service',
        'qualified_trust_service',
        entries,
      ),
    )
  }
  const result = combineAnd(statuses)
  entries.push({
    kind: 'condition',
    label,
    status: result,
    code: `condition.${classId}.${idx + 1}`,
    class_id: classId,
  })
  return result
}

/** Eine Klasse erfüllt, wenn SECTOR passt UND (eine Bedingung ODER-erfüllt). */
function evalClass(cls: EntityClass, facts: VerdictFacts, entries: TraceEntry[]): Status {
  if (cls.sectors && (!facts.sector || !cls.sectors.includes(facts.sector))) {
    entries.push({
      kind: 'class',
      label: cls.label,
      status: 'skipped',
      detail: 'Sektor passt nicht',
      code: `class.${cls.id}`,
      class_id: cls.id,
    })
    return 'skipped'
  }
  const condStatuses = (cls.conditions ?? []).map((c, i) => evalCondition(c, facts, i, cls.id, entries))
  const status = cls.conditions === undefined ? 'pass' : combineOr(condStatuses)
  entries.push({
    kind: 'class',
    label: cls.label,
    status: status === 'skipped' ? 'fail' : status,
    detail: cls.note,
    code: `class.${cls.id}`,
    class_id: cls.id,
  })
  return status
}

function collectMissing(entries: TraceEntry[]): MissingInput[] {
  const seen = new Set<string>()
  const out: MissingInput[] = []
  for (const e of entries) {
    if (e.status !== 'undetermined') continue
    const key = e.input_key ?? e.code ?? e.label
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ key, label: e.label })
  }
  return out
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

function triggerInfos(file: RulesFile): IncidentTriggerInfo[] {
  return (file.incident_policy?.triggers ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    citation: t.citation,
    severity_hint: t.severity_hint,
    clock_stage: t.clock_stage,
    signals: t.signals,
    note: t.note,
  }))
}

function summarizeTrace(
  entries: TraceEntry[],
  matchedClassId: string | null | undefined,
  unclearCode?: UnclearCode,
): string {
  const parts: string[] = []
  const est = entries.find((e) => e.kind === 'establishment')
  if (est) parts.push(est.status === 'pass' ? 'establishment:pass' : 'establishment:fail')
  const sector = entries.find((e) => e.kind === 'sector')
  if (sector) parts.push(`sector:${sector.status}`)
  if (matchedClassId) parts.push(`class:${matchedClassId}`)
  if (unclearCode) parts.push(`unclear:${unclearCode}`)
  const fired = entries.filter((e) => e.status === 'fired').map((e) => e.code ?? e.label)
  if (fired.length) parts.push(`fired:${fired.join('+')}`)
  return parts.join(' → ')
}

function buildVerdict(
  file: RulesFile,
  applicable: Applicable,
  confidence: number,
  reasoningMd: string,
  entries: TraceEntry[],
  missing: MissingInput[],
  opts: {
    unclearCode?: UnclearCode
    matchedClassId?: string | null
  } = {},
): RegimeVerdict {
  const deadlines: DeadlineInfo = {
    stages: file.reporting_clock.stages.map((s) => ({ key: s.key, hours: s.hours, label: s.label })),
    authority: file.reporting_clock.authority,
  }
  const missingUnique = missing
  const trace: ThresholdTrace = {
    entries,
    missing_inputs: missingUnique.map((m) => m.label),
    missing: missingUnique,
    summary: summarizeTrace(entries, opts.matchedClassId, opts.unclearCode),
    matched_class_id: opts.matchedClassId ?? null,
    unclear_code: opts.unclearCode,
    rules_version: file.version_label,
    engine_schema: file.engine_schema,
  }
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
    unclearCode: opts.unclearCode,
    matchedClassId: opts.matchedClassId ?? null,
    engineSchema: file.engine_schema,
    significanceNoteMd: file.incident_policy?.significance_note_md,
    incidentTriggers: triggerInfos(file),
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

  // 1) Örtliche Anwendbarkeit (Niederlassungs-Prinzip). Töchter-Erweiterung nur,
  //    wenn das Regime sie deklariert (establishment_via_subsidiary).
  const established =
    facts.countryHq === file.applicability_country ||
    (file.establishment_via_subsidiary === true &&
      facts.subsidiaries.some((s) => s.country === file.applicability_country))
  entries.push({
    kind: 'establishment',
    label: `Niederlassung im Anwendungsgebiet (${file.applicability_country.toUpperCase()})`,
    status: established ? 'pass' : 'fail',
    detail: facts.countryHq ? `Hauptsitz: ${facts.countryHq.toUpperCase()}` : 'Hauptsitz unbekannt',
    code: `establishment.${file.applicability_country}`,
    input_key: 'country_hq',
  })
  if (!established) {
    const verdict = buildVerdict(
      file,
      'not_applicable',
      0.9,
      `Es ist keine Niederlassung in ${file.applicability_country.toUpperCase()} bekannt – Hauptsitz: ${(facts.countryHq ?? 'unbekannt').toUpperCase()}. Das ${file.law_name} ist damit nicht direkt anwendbar.`,
      entries,
      [],
    )
    return applyIndirectExposure(file, facts, verdict)
  }

  // 2) Sektor
  if (!facts.sector || facts.sector === 'unknown') {
    const missing: MissingInput[] = [{ key: 'sector', label: 'Branche' }]
    entries.push({
      kind: 'sector',
      label: 'Branche',
      status: 'undetermined',
      detail: 'keine Angabe',
      code: 'sector',
      input_key: 'sector',
    })
    return buildVerdict(
      file,
      'unclear',
      0.5,
      `Die Branche wurde nicht angegeben. Der Anwendungsbereich des ${file.law_name} ist sektorabhängig – bitte Branche ergänzen, um eine verbindliche Aussage zu erhalten.`,
      entries,
      missing,
      { unclearCode: 'missing_sector' },
    )
  }
  entries.push({
    kind: 'sector',
    label: `Branche: ${facts.sector}`,
    status: 'pass',
    code: `sector.${facts.sector}`,
    input_key: 'sector',
  })

  // 3) Entitätsklassen in YAML-Reihenfolge (Priorität) auswerten.
  //    Pass einer Klasse gilt nur als verbindlich, wenn keine
  //    höher-priorisierte Klasse offen bleibt (die könnte das Urteil ändern).
  let anyUndetermined = false
  for (const cls of file.entity_classes) {
    const status = evalClass(cls, facts, entries)
    if (status === 'pass') {
      if (anyUndetermined) {
        const missing = collectMissing(entries)
        return buildVerdict(
          file,
          'unclear',
          0.5,
          `Eine Einordnung ist möglich, aber eine höher priorisierte Kategorie bleibt offen (${missing.map((m) => m.label).join(', ') || 'Angaben fehlen'}). Beispiel: Ohne bekannten eIDAS-Qualifikationsstatus eines Vertrauensdiensteanbieters ist nicht entscheidbar, ob die besonders wichtige oder die wichtige Variante greift. Bitte ergänzen.`,
          entries,
          missing,
          { unclearCode: 'higher_class_undetermined', matchedClassId: cls.id },
        )
      }
      const applicable: Applicable = cls.outcome === 'unclear' ? 'unclear' : 'applicable'
      const confidence = cls.outcome === 'unclear' ? 0.6 : 0.9
      const reason = `${reasonEstablished(file, facts)} Einordnung: **${cls.label}** – die Voraussetzungen sind nach den vorliegenden Angaben erfüllt.${cls.note ? ` Hinweis: ${cls.note}` : ''}`
      return buildVerdict(file, applicable, confidence, reason, entries, [], {
        unclearCode: cls.outcome === 'unclear' ? 'entity_class_outcome' : undefined,
        matchedClassId: cls.id,
      })
    }
    if (status === 'undetermined') anyUndetermined = true
  }

  // 4) Sektor passt, aber keine Klasse erfüllt
  if (anyUndetermined) {
    const missing = collectMissing(entries)
    return buildVerdict(
      file,
      'unclear',
      0.5,
      `Die Branche fällt in den Anwendungsbereich des ${file.law_name}, die Einordnung kann aber nicht abschließend getroffen werden, weil folgende Angaben fehlen: ${missing.map((m) => m.label).join(', ') || 'unbekannt'}. Bitte ergänzen – die Engine errät keine Schwellenwerte.`,
      entries,
      missing,
      { unclearCode: 'missing_size_inputs' },
    )
  }

  const below = file.below_threshold ?? {
    outcome: 'unclear' as const,
    note: 'Schwellenwerte nicht erreicht; manuelle Prüfung empfohlen.',
  }
  // Konfidenz 0.8: Alle vorliegenden Angaben sind entscheidbar – die Offenheit
  // ist juristisch (Einstufung/NISV/Listenposition), nicht fehlende Daten.
  const unclearCode: UnclearCode | undefined =
    below.outcome === 'unclear' ? 'classification_open' : undefined
  const verdict = buildVerdict(
    file,
    below.outcome,
    0.8,
    `Die Branche ist grundsätzlich einschlägig, aber die Schwellenwerte werden nach den vorliegenden Angaben nicht erreicht. ${below.note}`,
    entries,
    [],
    { unclearCode },
  )
  return applyIndirectExposure(file, facts, verdict)
}

/** Fact getters for declarative factor `when` clauses. */
function readFact(facts: VerdictFacts, fact: string): unknown {
  switch (fact) {
    case 'euCustomersWithSecurityClauses':
      return facts.euCustomersWithSecurityClauses
    case 'supplyChainCritical':
      return facts.supplyChainCritical
    case 'designatedCritical':
      return facts.designatedCritical
    case 'qualifiedTrustService':
      return facts.qualifiedTrustService
    default:
      return undefined
  }
}

function evalFactorWhen(when: FactorWhen, facts: VerdictFacts): { status: Status; detail: string } {
  switch (when.kind) {
    case 'subsidiary_in': {
      const match = facts.subsidiaries.find((s) => {
        if (when.region === 'eu') return isEu(s.country)
        return when.countries?.includes(s.country) ?? false
      })
      return match
        ? {
            status: 'fired',
            detail: match.name
              ? `Tochter: ${match.name} (${match.country.toUpperCase()})`
              : `Tochter in ${match.country.toUpperCase()}`,
          }
        : { status: 'fail', detail: 'keine passende Tochter bekannt' }
    }
    case 'fact_equals': {
      const v = readFact(facts, when.fact)
      const undeterminedSet = new Set(
        (when.undetermined_when ?? ['unknown', null]).map((x) => String(x)),
      )
      if (v === undefined || undeterminedSet.has(String(v))) {
        return { status: 'undetermined', detail: 'Angabe fehlt' }
      }
      return v === when.equals
        ? { status: 'fired', detail: `${when.fact}=${String(v)}` }
        : { status: 'fail', detail: 'nicht gegeben' }
    }
    case 'fact_truthy': {
      const v = readFact(facts, when.fact)
      if (v === undefined) return { status: 'undetermined', detail: 'Angabe fehlt' }
      return v === true
        ? { status: 'fired', detail: `${when.fact}=true` }
        : { status: 'fail', detail: 'nicht gegeben' }
    }
  }
}

/** Legacy id-based fallback – kept so older YAML without `when` still loads. */
function evalFactorById(factor: IndirectFactor, facts: VerdictFacts): { status: Status; detail: string } {
  switch (factor.id) {
    case 'eu_subsidiary': {
      const euSub = facts.subsidiaries.find((s) => isEu(s.country))
      return euSub
        ? {
            status: 'fired',
            detail: euSub.name
              ? `EU-Tochter: ${euSub.name} (${euSub.country.toUpperCase()})`
              : `EU-Tochter (${euSub.country.toUpperCase()})`,
          }
        : { status: 'fail', detail: 'keine EU-Tochter bekannt' }
    }
    case 'eu_customers_contract': {
      const v = facts.euCustomersWithSecurityClauses
      if (v === 'yes') return { status: 'fired', detail: 'EU-Kunden mit vertraglichen Sicherheitsanforderungen' }
      if (v === 'unknown' || v === undefined) return { status: 'undetermined', detail: 'Angabe fehlt' }
      return { status: 'fail', detail: 'nicht gegeben' }
    }
    case 'supply_chain_critical': {
      const v = facts.supplyChainCritical
      if (v === true) return { status: 'fired', detail: 'Position in kritischer Lieferkette' }
      if (v === undefined) return { status: 'undetermined', detail: 'Angabe fehlt' }
      return { status: 'fail', detail: 'nicht gegeben' }
    }
    default:
      return { status: 'undetermined', detail: `Faktor „${factor.id}“ nicht auswertbar` }
  }
}

/**
 * CH-Zweig als generischer Mechanismus: Nur wenn eine Regeldatei
 * `indirect_exposure` deklariert, werden Faktoren ausgewertet. Die juristische
 * Bewertung (welche Faktoren zählen) steht in der YAML, die Mechanik hier.
 */
function applyIndirectExposure(file: RulesFile, facts: VerdictFacts, verdict: RegimeVerdict): RegimeVerdict {
  const indirect = file.indirect_exposure
  // Anwendbare Urteile brauchen keine Indirekt-Betrachtung; ohne deklarierte
  // Faktoren gibt es nichts zu prüfen. Ausgewertet wird für nicht anwendbar
  // UND für etablierte-unklare Urteile (Faktoren können die Offenheit schärfen).
  if (!indirect || verdict.applicable === 'applicable') return verdict

  const entries = [...verdict.thresholdTrace.entries]
  const missing = [...(verdict.thresholdTrace.missing ?? [])]
  const fired: string[] = []
  const undetermined: string[] = []

  for (const factor of indirect.factors) {
    const result = factor.when ? evalFactorWhen(factor.when, facts) : evalFactorById(factor, facts)
    entries.push({
      kind: 'factor',
      label: factor.label,
      status: result.status,
      detail: result.detail,
      code: `factor.${factor.id}`,
      input_key: factor.id,
    })
    if (result.status === 'fired') fired.push(factor.label)
    if (result.status === 'undetermined') {
      undetermined.push(factor.label)
      missing.push({ key: factor.id, label: factor.label })
    }
    // Notes on non-fail factors hint at follow-up without inventing a missing input.
    if (factor.note && result.status === 'fired') {
      // no-op: note lives on the factor; reasoning covers it
    }
  }

  if (fired.length > 0 || undetermined.length > 0) {
    const missingUnique = dedupeMissing(missing)
    return {
      ...verdict,
      applicable: 'unclear',
      confidence: 0.4,
      unclearCode: 'indirect_exposure',
      reasoningMd: `Die direkte Pflichtstellung nach dem ${file.law_name} ist nach den vorliegenden Angaben nicht abschließend feststellbar. ${indirect.label} ${[...fired, ...undetermined].join('; ')} begründen/erfordern jedoch eine Einzelfallprüfung – die Einordnung bleibt daher bewusst „unklar“${undetermined.length ? ' (Angaben ergänzen)' : ''}.`,
      thresholdTrace: {
        entries,
        missing_inputs: missingUnique.map((m) => m.label),
        missing: missingUnique,
        summary: summarizeTrace(entries, verdict.matchedClassId, 'indirect_exposure'),
        matched_class_id: verdict.matchedClassId ?? null,
        unclear_code: 'indirect_exposure',
        rules_version: file.version_label,
        engine_schema: file.engine_schema,
      },
    }
  }
  if (verdict.applicable === 'not_applicable') {
    return {
      ...verdict,
      reasoningMd: `${verdict.reasoningMd} ${indirect.label} Direkte wie indirekte Betroffenheit wurden geprüft; nach vorliegenden Angaben besteht keine Meldepflicht.`,
      thresholdTrace: {
        ...verdict.thresholdTrace,
        entries,
        missing_inputs: dedupeMissing(missing).map((m) => m.label),
        missing: dedupeMissing(missing),
        summary: summarizeTrace(entries, verdict.matchedClassId, verdict.unclearCode),
      },
    }
  }
  // Unklares Urteil ohne ausgelöste Faktoren bleibt unverändert – kein Text,
  // der eine entwarnende Aussage suggeriert.
  return {
    ...verdict,
    thresholdTrace: {
      ...verdict.thresholdTrace,
      entries,
      summary: summarizeTrace(entries, verdict.matchedClassId, verdict.unclearCode),
    },
  }
}

function dedupeMissing(items: MissingInput[]): MissingInput[] {
  const seen = new Set<string>()
  const out: MissingInput[] = []
  for (const m of items) {
    if (seen.has(m.key)) continue
    seen.add(m.key)
    out.push(m)
  }
  return out
}

function evalTriggerWhen(
  trigger: IncidentTrigger,
  signals: IncidentSignals,
): { status: 'fired' | 'fail' | 'undetermined'; detail: string } {
  const when = trigger.when
  switch (when.kind) {
    case 'always':
      return { status: 'fired', detail: 'immer einschlägig bei meldepflichtiger Einrichtung' }
    case 'availability_in': {
      const v = signals.service_availability
      if (v === undefined) return { status: 'undetermined', detail: 'Verfügbarkeit unbekannt' }
      return when.values.includes(v)
        ? { status: 'fired', detail: `service_availability=${v}` }
        : { status: 'fail', detail: `service_availability=${v}` }
    }
    case 'personal_data_in': {
      const v = signals.personal_data
      if (v === undefined) return { status: 'undetermined', detail: 'Angabe zu personenbezogenen Daten fehlt' }
      return when.values.includes(v)
        ? { status: 'fired', detail: `personal_data=${v}` }
        : { status: 'fail', detail: `personal_data=${v}` }
    }
    case 'affected_persons_in': {
      const v = signals.affected_persons
      if (v === undefined) return { status: 'undetermined', detail: 'Angabe zu betroffenen Personen fehlt' }
      return when.values.includes(v)
        ? { status: 'fired', detail: `affected_persons=${v}` }
        : { status: 'fail', detail: `affected_persons=${v}` }
    }
  }
}

/**
 * Match YAML `incident_policy.triggers` against Copilot signals.
 * Pure, explainable, versioned – no regime constants in code.
 */
export function matchIncidentTriggers(
  file: RulesFile,
  signals: IncidentSignals,
): IncidentTriggerMatch[] {
  const policy = file.incident_policy
  if (!policy) return []
  return policy.triggers.map((t) => {
    const result = evalTriggerWhen(t, signals)
    return {
      id: t.id,
      label: t.label,
      citation: t.citation,
      severity_hint: t.severity_hint,
      clock_stage: t.clock_stage,
      signals: t.signals,
      note: t.note,
      status: result.status,
      detail: result.detail,
    }
  })
}

/** Append trigger-match rows onto an existing verdict trace (Copilot path). */
export function attachTriggerMatches(
  verdict: RegimeVerdict,
  matches: IncidentTriggerMatch[],
): RegimeVerdict {
  if (matches.length === 0) return verdict
  const entries: TraceEntry[] = [
    ...verdict.thresholdTrace.entries,
    ...matches.map((m) => ({
      kind: 'trigger' as const,
      label: m.label,
      status: m.status,
      detail: `${m.citation}${m.detail ? ` · ${m.detail}` : ''}`,
      code: `trigger.${m.id}`,
      input_key: m.id,
    })),
  ]
  const missingExtra: MissingInput[] = matches
    .filter((m) => m.status === 'undetermined')
    .map((m) => ({ key: m.id, label: m.label }))
  const missing = dedupeMissing([...(verdict.thresholdTrace.missing ?? []), ...missingExtra])
  return {
    ...verdict,
    thresholdTrace: {
      ...verdict.thresholdTrace,
      entries,
      missing,
      missing_inputs: missing.map((m) => m.label),
      summary: summarizeTrace(entries, verdict.matchedClassId, verdict.unclearCode),
    },
  }
}

/** Alle Regime-Fassungen unabhängig voneinander auswerten – niemals zusammenfassen. */
export function evaluateAll(files: RulesFile[], facts: VerdictFacts): RegimeVerdict[] {
  return files.map((f) => evaluateRegime(f, facts))
}

/**
 * Entity-scope + incident-trigger matching in one pass – what the Incident
 * Copilot calls. Triggers are attached to the threshold trace for explainability.
 */
export function evaluateAllWithIncidentSignals(
  files: RulesFile[],
  facts: VerdictFacts,
  signals: IncidentSignals,
): RegimeVerdict[] {
  return files.map((f) => {
    const base = evaluateRegime(f, facts)
    const matches = matchIncidentTriggers(f, signals)
    return attachTriggerMatches(base, matches)
  })
}
