import type { Metadata } from 'next'
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/site-url'

export const SITE_TITLE = 'NexusScope — DACH Regulatory Readiness Intelligence'
export const SITE_DESCRIPTION =
  'NexusScope helps DACH companies understand which regulatory reporting regimes may apply, why they apply, and what to do next.'

export const OG_IMAGE_ALT = SITE_TITLE
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const

const SOFTWARE_DESCRIPTION =
  'NexusScope is a regulatory readiness tool for DACH companies. It maps an organisation against German, Austrian and Swiss cyber-incident reporting regimes (NIS2UmsuCG, NISG 2024, ISG), explains why a regime may apply, and lists reporting deadlines and gaps.'

/** Canonical + hreflang. Language is cookie-based (no /de path), so EN/DE share the URL. */
export function pathAlternates(path: string = '/'): NonNullable<Metadata['alternates']> {
  const url = canonicalUrl(path)
  return {
    canonical: url,
    languages: {
      en: url,
      de: url,
      'x-default': url,
    },
  }
}

function absoluteTitle(title: Metadata['title']): string {
  if (typeof title === 'string') {
    return title.includes('NexusScope') ? title : `${title} — NexusScope`
  }
  return SITE_TITLE
}

/** Path-specific SEO fields that child pages must set so they do not inherit the homepage canonical. */
export function publicPageMeta(path: string, extra: Metadata = {}): Metadata {
  const url = canonicalUrl(path)
  const { openGraph, twitter, other, alternates, title, description, ...rest } = extra
  const pageTitle = absoluteTitle(title)
  const pageDescription = typeof description === 'string' ? description : SITE_DESCRIPTION
  const ogImage = {
    url: '/opengraph-image',
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt: OG_IMAGE_ALT,
  }
  return {
    ...rest,
    title,
    description,
    alternates: {
      ...pathAlternates(path),
      ...alternates,
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      siteName: 'NexusScope',
      locale: 'en_GB',
      alternateLocale: ['de_DE'],
      type: 'website',
      images: [ogImage],
      ...openGraph,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
      ...twitter,
    },
    other: {
      ...other,
      'twitter:url': url,
    },
  }
}

export function jsonLdGraph(): Record<string, unknown> {
  const orgId = `${CANONICAL_ORIGIN}/#organization`
  const websiteId = `${CANONICAL_ORIGIN}/#website`
  const appId = `${CANONICAL_ORIGIN}/#software`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'NexusScope',
        url: CANONICAL_ORIGIN,
        logo: `${CANONICAL_ORIGIN}/favicon.svg`,
        email: 'hello@nexusscopes.com',
        areaServed: [
          { '@type': 'Country', name: 'Germany' },
          { '@type': 'Country', name: 'Austria' },
          { '@type': 'Country', name: 'Switzerland' },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: 'NexusScope',
        url: CANONICAL_ORIGIN,
        inLanguage: ['en', 'de'],
        publisher: { '@id': orgId },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': appId,
        name: 'NexusScope',
        url: CANONICAL_ORIGIN,
        description: SOFTWARE_DESCRIPTION,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: ['en', 'de'],
        offers: {
          '@type': 'Offer',
          url: canonicalUrl('/pricing'),
          priceCurrency: 'EUR',
        },
        featureList: [
          'NIS2UmsuCG (Germany) applicability assessment',
          'NISG 2024 (Austria) applicability assessment',
          'ISG (Switzerland) applicability assessment',
          'Reporting deadlines and prioritised gap list',
        ],
        audience: {
          '@type': 'Audience',
          geographicArea: [
            { '@type': 'Country', name: 'Germany' },
            { '@type': 'Country', name: 'Austria' },
            { '@type': 'Country', name: 'Switzerland' },
          ],
        },
        publisher: { '@id': orgId },
      },
    ],
  }
}

export { CANONICAL_ORIGIN, canonicalUrl }
