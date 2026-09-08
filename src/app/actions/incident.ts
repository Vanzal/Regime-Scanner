'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { localeFromCookie, type Locale } from '@/i18n'
import { IncidentIntakeSchema } from '@/lib/incident/schema'
import { createIncident, runIncidentTriage } from '@/lib/incident'

export interface IncidentFormState {
  ok: boolean
  errors?: Record<string, string>
}

function formToRaw(fd: FormData): Record<string, unknown> {
  return {
    description: fd.get('description'),
    discovered_at: fd.get('discovered_at'),
    systems_affected: fd.get('systems_affected'),
    personal_data: fd.get('personal_data'),
    service_availability: fd.get('service_availability'),
    affected_persons: fd.get('affected_persons'),
    country_hq: fd.get('country_hq'),
  }
}

/** Server Action: validieren → Triage (Rules Engine) → speichern → Token-URL. */
export async function submitIncident(
  _prev: IncidentFormState,
  fd: FormData,
): Promise<IncidentFormState> {
  const parsed = IncidentIntakeSchema.safeParse(formToRaw(fd))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }

  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const triage = runIncidentTriage(parsed.data, locale)
  const record = createIncident({ locale, intake: parsed.data, triage })

  redirect(`/incident/${record.token}`)
}
