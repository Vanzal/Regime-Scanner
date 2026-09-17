import { jsonLdGraph } from '@/lib/seo'

/** Organization, WebSite, and SoftwareApplication JSON-LD for the production domain. */
export function JsonLd() {
  const json = JSON.stringify(jsonLdGraph())
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
