'use client'

import { useActionState } from 'react'
import { submitIncident, type IncidentFormState } from '@/app/actions/incident'
import {
  INCIDENT_COUNTRY_KEYS,
  ServiceAvailability,
  AffectedPersonsBand,
} from '@/lib/incident/schema'
import { YesNoUnknown } from '@/lib/intake/schema'
import type { Dictionary } from '@/i18n'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs font-medium text-rose-600">{msg}</p>
}

const labelCls = 'block text-sm font-semibold text-slate-800'
const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
const checkCls = 'h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200'

function toLocalInputValue(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function IncidentForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState<IncidentFormState, FormData>(
    submitIncident,
    { ok: false },
  )
  const errors = state.errors ?? {}
  const e = (k: string) => errors[k]
  const idict = dict.incident

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className={labelCls} htmlFor="description">
          {idict.fields.description}
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder={idict.fields.description_placeholder}
          className={inputCls}
        />
        <FieldError msg={e('description') ? idict.errors.required : undefined} />
      </div>

      <div>
        <label className={labelCls} htmlFor="discovered_at">
          {idict.fields.discovered_at}
        </label>
        <input
          id="discovered_at"
          name="discovered_at"
          type="datetime-local"
          required
          defaultValue={toLocalInputValue()}
          className={inputCls}
        />
        <FieldError msg={e('discovered_at') ? idict.errors.datetime : undefined} />
      </div>

      <div>
        <label className={labelCls} htmlFor="systems_affected">
          {idict.fields.systems}
        </label>
        <input
          id="systems_affected"
          name="systems_affected"
          type="text"
          required
          minLength={2}
          maxLength={1000}
          placeholder={idict.fields.systems_placeholder}
          className={inputCls}
        />
        <FieldError msg={e('systems_affected') ? idict.errors.required : undefined} />
      </div>

      <div>
        <span className={labelCls}>{idict.fields.personal_data}</span>
        <div className="mt-2 flex flex-wrap gap-4">
          {YesNoUnknown.options.map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="personal_data"
                value={v}
                required
                defaultChecked={v === 'unknown'}
                className={checkCls}
              />
              <span>{idict.yes_no_unknown[v]}</span>
            </label>
          ))}
        </div>
        <FieldError msg={e('personal_data') ? idict.errors.required : undefined} />
      </div>

      <div>
        <label className={labelCls} htmlFor="service_availability">
          {idict.fields.availability}
        </label>
        <select
          id="service_availability"
          name="service_availability"
          required
          defaultValue=""
          className={inputCls}
        >
          <option value="" disabled>
            –
          </option>
          {ServiceAvailability.options.map((v) => (
            <option key={v} value={v}>
              {idict.availability[v]}
            </option>
          ))}
        </select>
        <FieldError msg={e('service_availability') ? idict.errors.required : undefined} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="affected_persons">
            {idict.fields.affected_persons}
          </label>
          <select
            id="affected_persons"
            name="affected_persons"
            required
            defaultValue=""
            className={inputCls}
          >
            <option value="" disabled>
              –
            </option>
            {AffectedPersonsBand.options.map((v) => (
              <option key={v} value={v}>
                {idict.persons[v]}
              </option>
            ))}
          </select>
          <FieldError msg={e('affected_persons') ? idict.errors.required : undefined} />
        </div>
        <div>
          <label className={labelCls} htmlFor="country_hq">
            {idict.fields.country_hq}
          </label>
          <select id="country_hq" name="country_hq" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              –
            </option>
            {INCIDENT_COUNTRY_KEYS.map((c) => (
              <option key={c} value={c}>
                {idict.countries[c]}
              </option>
            ))}
          </select>
          <FieldError msg={e('country_hq') ? idict.errors.required : undefined} />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? idict.submitting : idict.submit}
      </button>
      <p className="text-xs text-slate-400">{idict.disclaimer_short}</p>
    </form>
  )
}
