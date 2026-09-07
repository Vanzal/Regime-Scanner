'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, checkAdminPassword, isAdmin, signAdminCookie } from '@/lib/admin/auth'
import { runScan } from '@/lib/scan/pipeline'
import { getStore } from '@/lib/store'
import { triggerScan } from '@/lib/scan/trigger'

export async function adminLogin(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  const password = String(fd.get('password') ?? '')
  if (!checkAdminPassword(password)) {
    return { error: 'Falsches Passwort.' }
  }
  const store = await cookies()
  store.set(ADMIN_COOKIE, signAdminCookie(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  redirect('/admin')
}

export async function adminLogout(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
  redirect('/admin/login')
}

/** Schützt alle Admin-Aktionen – nie auf Cookies der Session vertrauen, prüfen. */
async function requireAdminOrThrow(): Promise<void> {
  if (!(await isAdmin())) throw new Error('Nicht angemeldet')
}

export async function adminRerunScan(scanId: string): Promise<void> {
  await requireAdminOrThrow()
  const store = getStore()
  await store.updateScan(scanId, { status: 'queued', error: null, finished_at: null })
  triggerScan(scanId)
}
