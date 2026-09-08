import { z } from 'zod'
import { YesNoUnknown } from '@/lib/intake/schema'

/** DACH-Hauptsitz – Incident Copilot deckt nur DE/AT/CH ab. */
export const INCIDENT_COUNTRY_KEYS = ['de', 'at', 'ch'] as const

export const ServiceAvailability = z.enum(['available', 'degraded', 'offline'])

export const AffectedPersonsBand = z.enum([
  'none',
  '1_99',
  '100_999',
  '1000_plus',
  'unknown',
])

/**
 * Kurzes Incident-Intake (7 Felder) – bewusst getrennt vom Free-Scan-Intake.
 * Kein E-Mail-Gate: Zugang läuft über Token-URL.
 */
export const IncidentIntakeSchema = z.object({
  description: z.string().trim().min(10).max(2000),
  discovered_at: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'invalid_datetime' }),
  systems_affected: z.string().trim().min(2).max(1000),
  personal_data: YesNoUnknown,
  service_availability: ServiceAvailability,
  affected_persons: AffectedPersonsBand,
  country_hq: z.enum(INCIDENT_COUNTRY_KEYS),
})

export type IncidentIntake = z.infer<typeof IncidentIntakeSchema>
export type ServiceAvailabilityValue = z.infer<typeof ServiceAvailability>
export type AffectedPersonsBandValue = z.infer<typeof AffectedPersonsBand>
export type IncidentCountry = (typeof INCIDENT_COUNTRY_KEYS)[number]
