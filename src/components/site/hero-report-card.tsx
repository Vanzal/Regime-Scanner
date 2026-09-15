import type { Dictionary } from '@/i18n'
import type { SampleReport } from '@/lib/sample-reports'
import { SampleReportCard } from './sample-report-card'

/** Compact live-looking card for the hero (DE mid-market fixture). */
export function HeroReportCard({ report, dict }: { report: SampleReport; dict: Dictionary }) {
  return (
    <div className="ns-reveal ns-reveal-d2">
      <SampleReportCard report={report} dict={dict} compact />
    </div>
  )
}
