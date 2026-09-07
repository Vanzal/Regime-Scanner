import { z } from 'zod'

/** Kanonische Sektor-Keys – identisch mit denen in rules/*.yaml */
export const SECTOR_KEYS = [
  'energie', 'verkehr', 'banken', 'finanzmarktinfrastruktur', 'gesundheit',
  'trinkwasser', 'abwasser', 'digital_infrastruktur', 'weltraum',
  'post', 'abfallwirtschaft', 'chemie', 'lebensmittel', 'verarbeitendes_gewerbe',
  'digitale_dienste', 'it_dienst', 'forschung', 'oeffentliche_verwaltung',
  'telekommunikation', 'vertrauensdiensteanbieter', 'dns_diensteanbieter',
  'tld_registry', 'sonstige',
] as const

export const COUNTRY_KEYS = ['de', 'at', 'ch', 'fr', 'it', 'nl', 'pl', 'cz', 'other'] as const

export const EmployeesBand = z.enum(['lt_50', '50_249', '250_plus', 'unknown'])
export const RevenueBand = z.enum(['lt_10m', '10_50m', 'gt_50m', 'unknown'])
export const BalanceBand = z.enum(['lt_10m', '10_43m', 'gt_43m', 'unknown'])
export const YesNoUnknown = z.enum(['yes', 'no', 'unknown'])

/** Die 8 Fragen des Intake plus E-Mail-Gate. */
export const IntakeSchema = z.object({
  // Q1
  legal_name: z.string().trim().min(2),
  // Q2
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .transform((d) => d.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .refine((d) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d), {
      message: 'invalid_domain',
    }),
  // Q3
  country_hq: z.enum([...COUNTRY_KEYS, 'unknown']),
  // Q4
  employees_band: EmployeesBand,
  // Q5 (Jahresumsatz UND Jahresbilanzsumme – beides braucht § 28 BSIG)
  revenue_band: RevenueBand,
  balance_band: BalanceBand,
  // Q6
  sector: z.enum(SECTOR_KEYS),
  // Q6 advanced flags (Teil der Branchen-Frage)
  designated_critical: z.boolean().default(false),
  qualified_trust_service: z.boolean().default(false),
  // Q7
  subsidiary_countries: z.array(z.enum(COUNTRY_KEYS)).default([]),
  supply_chain_critical: z.boolean().default(false),
  // Q8
  eu_customers_security_clauses: YesNoUnknown,
  // E-Mail-Gate
  email: z.string().trim().toLowerCase().email({ message: 'invalid_email' }),
  consent_marketing: z.boolean().refine((v) => v === true, { message: 'consent_required' }),
})

export type IntakeAnswers = z.infer<typeof IntakeSchema>
export type EmployeesBandValue = z.infer<typeof EmployeesBand>
export type RevenueBandValue = z.infer<typeof RevenueBand>
export type BalanceBandValue = z.infer<typeof BalanceBand>
