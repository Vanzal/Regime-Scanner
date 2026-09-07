'use client'

import { useActionState } from 'react'
import { submitIntake, type IntakeState } from '@/app/actions/intake'
import { SECTOR_KEYS, COUNTRY_KEYS, EmployeesBand, RevenueBand, BalanceBand, YesNoUnknown } from '@/lib/intake/schema'
import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'

const SECTOR_GROUPS: Array<{ group: 'gruppe_kritisch' | 'gruppe_weitere' | 'gruppe_sonstige'; keys: string[] }> = [
  {
    group: 'gruppe_kritisch',
    keys: ['energie', 'verkehr', 'banken', 'finanzmarktinfrastruktur', 'gesundheit', 'trinkwasser', 'abwasser', 'digital_infrastruktur', 'weltraum'],
  },
  {
    group: 'gruppe_weitere',
    keys: [
      'post', 'abfallwirtschaft', 'chemie', 'lebensmittel', 'verarbeitendes_gewerbe',
      'digitale_dienste', 'it_dienst', 'forschung', 'oeffentliche_verwaltung',
      'telekommunikation', 'vertrauensdiensteanbieter', 'dns_diensteanbieter', 'tld_registry',
    ],
  },
  { group: 'gruppe_sonstige', keys: ['sonstige'] },
]

const SUBSIDIARY_COUNTRIES = COUNTRY_KEYS.filter(
  (c) => c !== 'other',
) as Exclude<(typeof COUNTRY_KEYS)[number], 'other'>[]

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs font-medium text-rose-600">{msg}</p>
}

const labelCls = 'block text-sm font-semibold text-slate-800'
const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
const checkCls = 'h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200'

export function IntakeForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState<IntakeState, FormData>(submitIntake, { ok: false })
  const errors = state.errors ?? {}
  const e = (k: string) => errors[k]
  const idict = dict.intake

  return (
    <form action={formAction} className="space-y-8">
      {/* Q1 + Q2 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="legal_name">{idict.q1_label}</label>
          <input id="legal_name" name="legal_name" type="text" required minLength={2} placeholder={idict.q1_placeholder} className={inputCls} />
          <FieldError msg={e('legal_name')} />
        </div>
        <div>
          <label className={labelCls} htmlFor="domain">{idict.q2_label}</label>
          <input id="domain" name="domain" type="text" required inputMode="url" placeholder={idict.q2_placeholder} className={inputCls} />
          <FieldError msg={e('domain')} />
        </div>
      </div>

      {/* Q3 */}
      <div>
        <label className={labelCls} htmlFor="country_hq">{idict.q3_label}</label>
        <select id="country_hq" name="country_hq" required defaultValue="" className={inputCls}>
          <option value="" disabled>–</option>
          {(['de', 'at', 'ch', 'fr', 'it', 'nl', 'pl', 'cz', 'other', 'unknown'] as const).map((c) => (
            <option key={c} value={c}>{(idict.countries as Record<string, string>)[c] ?? c}</option>
          ))}
        </select>
        <FieldError msg={e('country_hq')} />
      </div>

      {/* Q4 + Q5 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls} htmlFor="employees_band">{idict.q4_label}</label>
          <select id="employees_band" name="employees_band" required defaultValue="" className={inputCls}>
            <option value="" disabled>–</option>
            {EmployeesBand.options.map((b) => (
              <option key={b} value={b}>{idict.bands.employees[b]}</option>
            ))}
          </select>
          <FieldError msg={e('employees_band')} />
        </div>
        <div>
          <label className={labelCls} htmlFor="revenue_band">{idict.q5_revenue_label}</label>
          <select id="revenue_band" name="revenue_band" required defaultValue="" className={inputCls}>
            <option value="" disabled>–</option>
            {RevenueBand.options.map((b) => (
              <option key={b} value={b}>{idict.bands.revenue[b]}</option>
            ))}
          </select>
          <FieldError msg={e('revenue_band')} />
        </div>
        <div>
          <label className={labelCls} htmlFor="balance_band">{idict.q5_balance_label}</label>
          <select id="balance_band" name="balance_band" required defaultValue="" className={inputCls}>
            <option value="" disabled>–</option>
            {BalanceBand.options.map((b) => (
              <option key={b} value={b}>{idict.bands.balance[b]}</option>
            ))}
          </select>
          <FieldError msg={e('balance_band')} />
        </div>
      </div>

      {/* Q6 */}
      <div>
        <label className={labelCls} htmlFor="sector">{idict.q6_label}</label>
        <p className="mt-1 text-xs text-slate-500">{idict.q6_hint}</p>
        <select id="sector" name="sector" required defaultValue="" className={inputCls}>
          <option value="" disabled>–</option>
          {SECTOR_GROUPS.map((g) => (
            <optgroup key={g.group} label={idict.sectors[g.group]}>
              {g.keys.map((k) => (
                <option key={k} value={k}>{idict.sectors[k as keyof typeof idict.sectors] ?? k}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <FieldError msg={e('sector')} />
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="designated_critical" className={`${checkCls} mt-0.5`} />
            <span>{idict.critical_label}</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="qualified_trust_service" className={`${checkCls} mt-0.5`} />
            <span>{idict.trust_service_label}</span>
          </label>
        </div>
      </div>

      {/* Q7 */}
      <div>
        <span className={labelCls}>{idict.q7_label}</span>
        <p className="mt-1 text-xs text-slate-500">{idict.q7_hint}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUBSIDIARY_COUNTRIES.map((c) => (
            <label key={c} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" name="subsidiary_countries" value={c} className={checkCls} />
              <span>{idict.countries[c]}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="supply_chain_critical" className={`${checkCls} mt-0.5`} />
            <span>{idict.supply_chain_label}</span>
          </label>
        </div>
      </div>

      {/* Q8 */}
      <div>
        <span className={labelCls}>{idict.q8_label}</span>
        <p className="mt-1 text-xs text-slate-500">{idict.q8_hint}</p>
        <div className="mt-2 flex gap-4">
          {YesNoUnknown.options.map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" name="eu_customers_security_clauses" value={v} required defaultChecked={v === 'unknown'} className={checkCls} />
              <span>{idict.bands.eu_customers[v]}</span>
            </label>
          ))}
        </div>
        <FieldError msg={e('eu_customers_security_clauses')} />
      </div>

      {/* E-Mail-Gate */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className={labelCls} htmlFor="email">{idict.email_label}</label>
        <input id="email" name="email" type="email" required placeholder="name@firma.de" className={inputCls} />
        <p className="mt-1 text-xs text-slate-500">{idict.email_hint}</p>
        <FieldError msg={e('email')} />
        <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consent_marketing" required className={`${checkCls} mt-0.5`} />
          <span>{idict.consent_label}</span>
        </label>
        <FieldError msg={e('consent_marketing')} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? idict.submitting : idict.submit}
      </button>
      <p className="text-xs text-slate-400">{dict.landing.disclaimer_short}</p>
    </form>
  )
}
