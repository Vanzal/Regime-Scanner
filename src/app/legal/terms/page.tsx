import { legalMetadata, LegalDocumentPage } from '@/components/site/legal-document'

export const dynamic = 'force-dynamic'

export const metadata = legalMetadata('terms')

export default function TermsPage() {
  return <LegalDocumentPage id="terms" />
}
