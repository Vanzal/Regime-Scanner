'use server'

import { z } from 'zod'
import { getStore } from '@/lib/store'

export interface WaitlistState {
  ok: boolean
  done?: boolean
  duplicate?: boolean
  email?: string
  errors?: Record<string, string>
}

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  company_size: z.enum(['lt_50', '50_249', '250_plus', 'unknown']),
  country: z.enum(['de', 'at', 'ch', 'other']),
  pain_note: z.string().trim().max(500).optional().or(z.literal('')),
})

/** Server Action unter dem Wartelisten-Formular der Landing-Page. */
export async function joinWaitlist(_prev: WaitlistState, fd: FormData): Promise<WaitlistState> {
  const parsed = WaitlistSchema.safeParse({
    email: fd.get('email'),
    company_size: fd.get('company_size'),
    country: fd.get('country'),
    pain_note: fd.get('pain_note') ?? '',
  })
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }

  const { entry, duplicate } = await getStore().joinWaitlist({
    email: parsed.data.email,
    company_size: parsed.data.company_size,
    country: parsed.data.country,
    pain_note: parsed.data.pain_note || null,
  })

  return { ok: true, done: true, duplicate, email: entry.email, errors: {} }
}
