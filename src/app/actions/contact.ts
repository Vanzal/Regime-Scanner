'use server'

import { z } from 'zod'
import { getStore } from '@/lib/store'

export interface ContactState {
  ok: boolean
  done?: boolean
  errors?: Record<string, string>
}

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  message: z.string().trim().min(8).max(2000),
})

export async function sendContact(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const parsed = ContactSchema.safeParse({
    name: fd.get('name'),
    email: fd.get('email'),
    company: fd.get('company') ?? '',
    message: fd.get('message'),
  })
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }

  await getStore().createContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company || null,
    message: parsed.data.message,
  })

  return { ok: true, done: true, errors: {} }
}
