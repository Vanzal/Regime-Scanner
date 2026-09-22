import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'
import { renderInlineMd } from './md'
import type { ReportAssessment } from '@/lib/report/data'
import type { Applicable } from '@/lib/rules/types'

const BADGE_STYLE: Record<Applicable, string> = {
  applicable: 'ns-status-in',
  not_applicable: 'ns-status-out',
  unclear: 'ns-status-unclear',
}

export function regimeLabel(dict: Dictionary, regime: string): { code: string; name: string; lawShort: string } {
  const block = (dict.regimes as Record<string, { code: string; name: string; law_short: string }>)[regime]
  return {
    code: block?.code ?? regime.toUpperCase(),
    name: block?.name ?? regime,
    lawShort: block?.law_short ?? '',
  }
}

function applicabilityRank(value: Applicable): number {
  if (value === 'applicable') return 0
  if (value === 'unclear') return 1
  return 2
}

function VerdictCard({
  assessment,
  dict,
  prominent,
}: {
  assessment: ReportAssessment
  dict: Dictionary
  prominent: boolean
}) {
  const label = regimeLabel(dict, assessment.regime)
  const overridden = assessment.override_applicable !== null && assessment.override_applicable !== undefined
  return (
    <div
      data-testid={`verdict-card-${assessment.regime}`}
      className={cn('ns-card flex flex-col gap-3 p-5', prominent && 'sm:p-7')}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn('font-semibold text-[var(--ns-fg)]', prominent ? 'text-base sm:text-lg' : 'text-sm')}>
          {label.code}
        </span>
        <span
          data-testid={`verdict-badge-${assessment.regime}`}
          className={cn(
            'rounded-md border font-bold tracking-wide',
            prominent ? 'px-3 py-1 text-xs sm:text-sm' : 'px-2.5 py-0.5 text-[11px]',
            BADGE_STYLE[assessment.effectiveApplicable],
          )}
        >
          {t(dict, `report.verdict.${assessment.effectiveApplicable}`)}
        </span>
      </div>
      <p className="text-xs font-medium text-[var(--ns-fg-dim)]">
        {label.name} · {label.lawShort}
      </p>
      <p className={cn('leading-snug text-[var(--ns-fg)]', prominent ? 'text-sm sm:text-base' : 'text-sm')}>
        {renderInlineMd(assessment.effectiveReasoning.split('\n')[0])}
      </p>
      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-[var(--ns-fg-dim)]">
        <span>
          {t(dict, 'report.verdict.confidence')}: {Math.round(assessment.confidence * 100)} %
        </span>
        {overridden && (
          <span
            className="rounded-full border border-[var(--ns-accent)] px-2 py-0.5 font-medium text-[var(--ns-accent)]"
            title={t(dict, 'report.verdict.override_note')}
          >
            {t(dict, 'report.verdict.manually_reviewed')}
          </span>
        )}
      </div>
    </div>
  )
}

/** Independent DE/AT/CH verdicts. Applicable regime gets full weight; others sit as supporting cards. */
export function VerdictStrip({ assessments, dict }: { assessments: ReportAssessment[]; dict: Dictionary }) {
  const order = ['de', 'at', 'ch']
  const sorted = [...assessments].sort(
    (a, b) => order.indexOf(a.regime) - order.indexOf(b.regime),
  )
  const primary =
    [...sorted].sort(
      (a, b) =>
        applicabilityRank(a.effectiveApplicable) - applicabilityRank(b.effectiveApplicable) ||
        order.indexOf(a.regime) - order.indexOf(b.regime),
    )[0] ?? sorted[0]
  const supporting = sorted.filter((a) => a.regime !== primary?.regime)

  if (!primary) return null

  return (
    <div className="space-y-4">
      <VerdictCard assessment={primary} dict={dict} prominent />
      {supporting.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {supporting.map((a) => (
            <VerdictCard key={a.regime} assessment={a} dict={dict} prominent={false} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
