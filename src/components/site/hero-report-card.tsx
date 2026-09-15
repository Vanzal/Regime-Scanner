import type { SampleReportView } from '@/lib/sample-reports'
import { SampleReportCard, type SampleReportCardDict } from './sample-report-card'

/** Compact live-looking card for the hero (DE mid-market fixture). */
export function HeroReportCard({ report, dict }: { report: SampleReportView; dict: SampleReportCardDict }) {
  return <SampleReportCard report={report} dict={dict} compact />
}
