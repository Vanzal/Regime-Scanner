import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'rr_admin'
const MAX_AGE_S = 60 * 60 * 8 // 8 Stunden Pilotbetrieb

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? 'dev-insecure-secret'
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD)
}

/** HMAC-signiertes Ablauf-Token: "<epoch_s>.<hmac>" – httpOnly, SameSite=lax. */
export function signAdminCookie(): string {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE_S)
  const sig = createHmac('sha256', secret()).update(exp).digest('hex')
  return `${exp}.${sig}`
}

export function verifyAdminCookie(value: string | undefined): boolean {
  if (!value) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig) return false
  const expect = createHmac('sha256', secret()).update(exp).digest('hex')
  const a = Buffer.from(sig, 'hex')
  const b = Buffer.from(expect, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  return Number(exp) > Math.floor(Date.now() / 1000)
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return verifyAdminCookie(store.get(ADMIN_COOKIE)?.value)
}

/** Passwortabgleich (constant-time); Pilotbetrieb mit einem Operator-Passwort. */
export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
