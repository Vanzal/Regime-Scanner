import { NextResponse } from 'next/server'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

/**
 * Pollling-Endpunkt der Warteseite. Der Berichts-Token ist die Berechtigung
 * (ein Scan-ID allein ist kein Zugang): Token → Lead → gleiche Firma sonst 404.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scanId: string }> },
): Promise<Response> {
  const { scanId } = await params
  const token = new URL(_req.url).searchParams.get('t') ?? ''
  const store = getStore()

  const lead = await store.getLeadByToken(token)
  if (!lead) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const scan = await store.getScan(scanId)
  if (!scan || scan.company_id !== lead.company_id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({
    status: scan.status,
    mode: scan.mode,
    finished_at: scan.finished_at,
    released: scan.review_status === 'released',
    report_token: token,
  })
}
