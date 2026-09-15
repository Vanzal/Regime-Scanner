'use client'

import { useActionState } from 'react'
import { adminLogin } from '@/app/actions/admin'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined)
  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-xl tracking-tight text-[var(--ns-fg)]">Admin-Anmeldung</h1>
      <p className="mt-1 text-sm text-[var(--ns-fg-muted)]">Pilotbetrieb – Zugriff nur für Operator.</p>
      <form action={action} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Passwort"
          className="ns-input"
        />
        {state?.error && <p className="text-xs font-medium text-[var(--ns-danger)]">{state.error}</p>}
        <button type="submit" disabled={pending} className="ns-btn-primary w-full">
          Anmelden
        </button>
      </form>
    </main>
  )
}
