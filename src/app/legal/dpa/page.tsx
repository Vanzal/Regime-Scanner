import { legalMetadata, LegalDocumentPage } from '@/components/site/legal-document'

export const dynamic = 'force-dynamic'

export const metadata = legalMetadata('dpa')

export default function DpaPage() {
  return <LegalDocumentPage id="dpa" />
}
