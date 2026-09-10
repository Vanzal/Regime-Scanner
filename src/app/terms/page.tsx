import { permanentRedirect } from 'next/navigation'
import { LEGAL_DOCUMENTS } from '@/lib/legal/catalog'

export default function TermsAlias() {
  permanentRedirect(LEGAL_DOCUMENTS.terms.href)
}
