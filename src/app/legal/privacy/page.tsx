import { permanentRedirect } from 'next/navigation'
import { LEGAL_DOCUMENTS } from '@/lib/legal/catalog'

export default function LegalPrivacyAlias() {
  permanentRedirect(LEGAL_DOCUMENTS.privacy.href)
}
