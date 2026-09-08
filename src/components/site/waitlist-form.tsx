'use client'

import { useActionState } from 'react'
import { joinWaitlist, type WaitlistState } from '@/app/actions/waitlist'
import type { Dictionary } from '@/i18n'

const SIZE_KEYS = ['lt_50', '50_249', '250_plus', 'unknown'] as const
const COUNTRY_KEYS = ['de', 'at', 'ch', 'other'] as const

const labelCls = 'block text-sm font-semibold text-slate-200'
const inputCls =
  'mt-1.5 w-full rounded-lg border border-slate-700/80 bg-[#070b14] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'

export function WaitlistForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, { ok: false })
  const w = dict.site.waitlist
  const errors = state.errors ?? {}
  const errFor = (key: string): string | undefined => {
    if (!errors[key]) return undefined
    if (key === 'email') return w.errors.email
    if (key === 'country') return w.errors.country
    return w.errors.required
  }

  if (state.done) {
    return (
      <div
        role="status"
        data-testid="waitlist-success"
        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300" aria-hidden="true">
          ✓
        </div>
        <p className="font-display text-xl font-semibold text-cyan-200">{w.success}</p>
        {state.duplicate && <p className="mt-2 text-sm text-slate-300">{w.duplicate}</p>}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className={labelCls} htmlFor="wl_email">{w.email_label}</label>
        <input
          id="wl_email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputCls}
          aria-invalid={Boolean(errFor('email'))}
        />
        {errFor('email') && <p className="mt-1 text-xs font-medium text-rose-400">{errFor('email')}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="wl_size">{w.size_label}</label>
          <select id="wl_size" name="company_size" required defaultValue="" className={inputCls}>
            <option value="" disabled>–</option>
            {SIZE_KEYS.map((s) => (
              <option key={s} value={s}>{w.size[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="wl_country">{w.country_label}</label>
          <select id="wl_country" name="country" required defaultValue="" className={inputCls}>
            <option value="" disabled>–</option>
            {COUNTRY_KEYS.map((c) => (
              <option key={c} value={c}>{w.country[c]}</option>
            ))}
          </select>
          {errFor('country') && <p className="mt-1 text-xs font-medium text-rose-400">{errFor('country')}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="wl_pain">{w.pain_label}</label>
        <textarea id="wl_pain" name="pain_note" rows={3} maxLength={500} placeholder={w.pain_placeholder} className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_-12px_rgba(34,211,238,0.55)] transition hover:bg-cyan-300 disabled:opacity-60 sm:w-auto"
      >
        {pending ? w.submitting : w.submit}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">{w.privacy_note}</p>
    </form>
  )
}
