'use client'

import { useActionState } from 'react'
import { adminLogin } from '@/app/actions/admin'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined)
  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-xl font-bold text-slate-900">Admin-Anmeldung</h1>
      <p className="mt-1 text-sm text-slate-500">Pilotbetrieb – Zugriff nur für Operator.</p>
      <form action={action} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Passwort"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        {state?.error && <p className="text-xs font-medium text-rose-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Anmelden
        </button>
      </form>
    </main>
  )
}
