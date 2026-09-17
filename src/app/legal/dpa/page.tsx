import { permanentRedirect } from 'next/navigation'
import { LEGAL_DOCUMENTS } from '@/lib/legal/catalog'

export default function LegalDpaAlias() {
  permanentRedirect(LEGAL_DOCUMENTS.dpa.href)
}
