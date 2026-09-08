/**
 * Public surface of the versioned YAML rules engine.
 *
 * Adding a new regime:
 *   1. Create `rules/<iso2>-<slug>.v1.yaml` (see tests/fixtures/rules/xx-test.v1.yaml)
 *   2. Add a Locale block under `regimes.<iso2>` in de.json / en.json
 *   3. No engine code changes – proven by tests/rules/new-regime-fixture.test.ts
 *
 * Legal corrections: never edit thresholds in place – bump `version` (v2) and
 * `version_label`; `loadRules` picks the latest per regime automatically.
 */
export { RulesFileSchema, ENGINE_SCHEMA_VERSION } from './schema'
export type {
  Bounds,
  EntityClass,
  FactorWhen,
  IndirectFactor,
  IncidentTrigger,
  IncidentPolicy,
  RulesFile,
} from './schema'
export type {
  Applicable,
  UnclearCode,
  SizeInterval,
  Subsidiary,
  VerdictFacts,
  IncidentSignals,
  TraceEntry,
  MissingInput,
  ThresholdTrace,
  ClockStage,
  DeadlineInfo,
  IncidentTriggerInfo,
  IncidentTriggerMatch,
  RegimeVerdict,
} from './types'
export {
  resolveRulesDir,
  versionNumber,
  selectLatestByRegime,
  loadRules,
  loadAllRuleVersions,
  loadRulesFile,
} from './loader'
export {
  isEu,
  evaluateRegime,
  evaluateAll,
  matchIncidentTriggers,
  attachTriggerMatches,
  evaluateAllWithIncidentSignals,
} from './evaluate'
