'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SITE_GATE_COOKIE,
  SITE_GATE_MAX_AGE_S,
  checkSitePassword,
  safeNextPath,
  signSiteGateCookie,
} from '@/lib/site-gate'

export async function siteGateLogin(
  _prev: { error?: boolean } | undefined,
  fd: FormData,
): Promise<{ error?: boolean }> {
  const password = String(fd.get('password') ?? '')
  if (!checkSitePassword(password)) {
    return { error: true }
  }
  const store = await cookies()
  store.set(SITE_GATE_COOKIE, await signSiteGateCookie(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SITE_GATE_MAX_AGE_S,
  })
  redirect(safeNextPath(String(fd.get('next') ?? '/')))
}
