import type { ReactNode } from 'react'
import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import type { ReportData } from '@/lib/report/data'
import { ClockTimeline } from './clock-timeline'
import { Disclaimer } from './disclaimer'
import { GapList } from './gap-list'
import { ScopeCheckBlock } from './scope-check-block'
import { ThresholdTraceBlock } from './threshold-trace'
import { VerdictStrip } from './verdict-strip'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section data-testid={`section-${id}`} className="mt-10">
      <h3 className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Der Bericht – fünf Abschnitte in fester Reihenfolge (im Test abgesichert). */
export function ReportView({
  data,
  dict,
  token,
  showChrome = true,
}: {
  data: ReportData
  dict: Dictionary
  /** Berichts-Token (für den PDF-Funktionsaufruf) */
  token?: string
  /** Web-Extras (PDF-Button); ?print=1 blendet sie aus. */
  showChrome?: boolean
}) {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b-2 border-slate-900 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{dict.app.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {t(dict, 'report.title')} {data.company.legal_name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.company.domain} · {dict.scan.status_done}{' '}
          {data.scan.mode === 'fixture' && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-600/30">
              Demo
            </span>
          )}
        </p>
      </header>

      <Section id="verdicts" title={t(dict, 'report.section_verdicts')}>
        <VerdictStrip assessments={data.assessments} dict={dict} />
      </Section>

      {data.scopeCheck && (
        <Section id="scope" title={t(dict, 'report.section_scope')}>
          <ScopeCheckBlock result={data.scopeCheck} dict={dict} />
        </Section>
      )}

      <Section id="clock" title={t(dict, 'report.section_clock')}>
        <ClockTimeline assessments={data.assessments} dict={dict} />
      </Section>

      <Section id="gaps" title={t(dict, 'report.section_gaps')}>
        <GapList findings={data.findings} dict={dict} />
      </Section>

      <Section id="trace" title={t(dict, 'report.section_trace')}>
        <ThresholdTraceBlock assessments={data.assessments} dict={dict} />
      </Section>

      <Section id="limits" title={t(dict, 'report.section_limits')}>
        <Disclaimer data={data} dict={dict} />
      </Section>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
        {t(dict, 'report.disclaimer_footer')}
      </footer>

      {showChrome && (
        <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
          {process.env.SITE_URL && token && (
            <a
              href={`/.netlify/functions/render-pdf?token=${token}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {t(dict, 'report.download_pdf')}
            </a>
          )}
          <a
            href={`?print=1`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t(dict, 'report.print')}
          </a>
        </div>
      )}
    </article>
  )
}
