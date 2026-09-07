import { redirect } from 'next/navigation'
import { getDict } from '@/i18n'
import { adminConfigured, isAdmin } from '@/lib/admin/auth'
import { getStore } from '@/lib/store'
import { adminLogout, adminRerunScan } from '@/app/actions/admin'
import type { Scan } from '@/lib/store/types'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<Scan['status'], string> = {
  queued: 'bg-slate-100 text-slate-700',
  running: 'bg-indigo-100 text-indigo-800',
  done: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
}

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin nicht konfiguriert</h1>
        <p className="mt-2 text-sm text-slate-600">
          Setzen Sie <code className="rounded bg-slate-100 px-1">ADMIN_PASSWORD</code> in der Umgebung, um den Pilotmodus zu nutzen.
        </p>
      </main>
    )
  }
  if (!(await isAdmin())) redirect('/admin/login')

  const dict = getDict('de')
  const store = getStore()
  const scans = await store.listScans()
  const autoRelease = process.env.AUTO_RELEASE !== 'false'

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-slate-900">Admin · Scans</h1>
        <form action={adminLogout}>
          <button type="submit" className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline">
            Abmelden
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Pilotmodus: Freigabe {autoRelease ? 'automatisch (AUTO_RELEASE=true)' : 'manuell je Scan'} · Scan-Modus:{' '}
        {process.env.SCAN_MODE === 'live' ? 'live' : 'fixture'}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Firma</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Modus</th>
              <th className="px-4 py-2">Freigabe</th>
              <th className="px-4 py-2">Erstellt</th>
              <th className="px-4 py-2 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scans.map(({ scan, company }) => (
              <tr key={scan.id}>
                <td className="px-4 py-2">
                  <span className="font-medium text-slate-900">{company.legal_name}</span>
                  <span className="block text-xs text-slate-500">{company.domain}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[scan.status]}`}>
                    {(dict.scan as Record<string, string>)[`status_${scan.status}`] ?? scan.status}
                  </span>
                  {scan.error && <span className="mt-1 block text-[11px] text-rose-600">{scan.error}</span>}
                </td>
                <td className="px-4 py-2 text-xs text-slate-600">{scan.mode}</td>
                <td className="px-4 py-2 text-xs text-slate-600">
                  {scan.review_status === 'released' ? 'freigegeben' : 'in Prüfung'}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">{new Date(scan.created_at).toLocaleString('de-DE')}</td>
                <td className="px-4 py-2 text-right">
                  <form action={adminRerunScan.bind(null, scan.id)}>
                    <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Neu scannen
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {scans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  Noch keine Scans – Intake durchlaufen oder Seed starten.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
