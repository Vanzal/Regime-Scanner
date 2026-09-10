import type { Locale } from '@/i18n'

export const LEGAL_DOC_IDS = ['privacy', 'terms', 'dpa'] as const
export type LegalDocId = (typeof LEGAL_DOC_IDS)[number]

export type LegalDocumentMeta = {
  id: LegalDocId
  /** Canonical public path — the footer and in-document links use this. */
  href: string
  /** Extra paths that should land on the same document. */
  aliases: readonly string[]
  file: string
  title: Record<Locale, string>
  short: Record<Locale, string>
  description: Record<Locale, string>
}

/**
 * Published legal documents, ready for the site footer (and any later footer
 * redesign) to consume via `footerLegalLinks()`.
 *
 * Paths follow the documents themselves: Privacy at `/privacy`, Terms at
 * `/legal/terms`, DPA at `/legal/dpa`.
 */
export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocumentMeta> = {
  privacy: {
    id: 'privacy',
    href: '/privacy',
    aliases: ['/datenschutz', '/legal/privacy'],
    file: 'privacy.md',
    title: { en: 'Privacy Policy', de: 'Datenschutzerklärung' },
    short: { en: 'Privacy', de: 'Datenschutz' },
    description: {
      en: 'How NexusScope collects, uses, and protects personal data as controller, and how the DPA applies when we act as processor.',
      de: 'Wie NexusScope personenbezogene Daten als Verantwortlicher erhebt, nutzt und schützt, und wie der AVV gilt, wenn wir als Auftragsverarbeiter tätig sind.',
    },
  },
  terms: {
    id: 'terms',
    href: '/legal/terms',
    aliases: ['/terms'],
    file: 'terms.md',
    title: { en: 'Terms of Service', de: 'Nutzungsbedingungen' },
    short: { en: 'Terms', de: 'AGB' },
    description: {
      en: 'Terms governing access to and use of the NexusScope service, including consumer withdrawal rights, billing, and liability.',
      de: 'Bedingungen für den Zugang zu NexusScope, einschliesslich Widerrufsrecht, Abrechnung und Haftung.',
    },
  },
  dpa: {
    id: 'dpa',
    href: '/legal/dpa',
    aliases: [],
    file: 'dpa.md',
    title: { en: 'Data Processing Agreement', de: 'Auftragsverarbeitungsvertrag' },
    short: { en: 'DPA', de: 'AVV' },
    description: {
      en: 'Art. 28 GDPR / Art. 9 revFADP data processing agreement between the customer (controller) and NexusScope (processor).',
      de: 'Auftragsverarbeitungsvertrag nach Art. 28 DSGVO / Art. 9 revDSG zwischen Kundin (Verantwortliche) und NexusScope (Auftragsbearbeiter).',
    },
  },
}

/** Display order for footer and document-to-document navigation. */
export const LEGAL_DOCUMENT_ORDER: LegalDocId[] = ['privacy', 'terms', 'dpa']

export type FooterLegalLink = {
  id: LegalDocId
  href: string
  label: string
}

/** Stable contract for the site footer — map this list; do not hardcode paths. */
export function footerLegalLinks(locale: Locale): FooterLegalLink[] {
  return LEGAL_DOCUMENT_ORDER.map((id) => {
    const doc = LEGAL_DOCUMENTS[id]
    return { id, href: doc.href, label: doc.short[locale] }
  })
}

export function legalDocByHref(pathname: string): LegalDocumentMeta | undefined {
  const normalised = pathname.replace(/\/$/, '') || '/'
  return Object.values(LEGAL_DOCUMENTS).find(
    (doc) => doc.href === normalised || doc.aliases.includes(normalised),
  )
}
