import { legalMetadata, LegalDocumentPage } from '@/components/site/legal-document'

export const dynamic = 'force-dynamic'

export const metadata = legalMetadata('privacy')

export default function PrivacyPage() {
  return <LegalDocumentPage id="privacy" />
}
