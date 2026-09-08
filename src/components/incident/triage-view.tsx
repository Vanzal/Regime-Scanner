import type { Dictionary } from '@/i18n'
import { t } from '@/i18n'
import { renderInlineMd } from '@/components/report/md'
import { formatStageHours } from '@/components/report/clock-timeline'
import { regimeLabel } from '@/components/report/verdict-strip'
import type { IncidentRecord, TrafficLight } from '@/lib/incident/types'
import { CopyDraftButton } from './copy-draft-button'

const LIGHT_STYLE: Record<TrafficLight, string> = {
  red: 'bg-rose-100 text-rose-900 ring-rose-600/30',
  amber: 'bg-amber-100 text-amber-900 ring-amber-600/30',
  green: 'bg-emerald-100 text-emerald-900 ring-emerald-600/30',
}

const DOT: Record<TrafficLight, string> = {
  red: 'bg-rose-500',
  amber: 'bg-amber-400',
  green: 'bg-emerald-500',
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section data-testid={`incident-section-${id}`} className="mt-10">
      <h3 className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

function fmtDateTime(iso: string, locale: string): string {
  const d = new Date(iso)
  const loc = locale === 'de' ? 'de-DE' : 'en-GB'
  return `${d.toLocaleDateString(loc)}, ${d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`
}

/** Ergebnisansicht der Incident-Triage – Spiegel der Report-Abschnittsstruktur. */
export function IncidentTriageView({
  record,
  dict,
  showChrome = true,
}: {
  record: IncidentRecord
  dict: Dictionary
  showChrome?: boolean
}) {
  const { intake, triage, token } = record
  const order = ['de', 'at', 'ch']
  const regimes = [...triage.regimes].sort((a, b) => order.indexOf(a.regime) - order.indexOf(b.regime))
  const relevant = regimes.filter((r) => r.applicable !== 'not_applicable')

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b-2 border-slate-900 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{dict.app.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {dict.incident.result.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {dict.incident.result.created}: {fmtDateTime(record.created_at, record.locale)} ·{' '}
          {dict.incident.countries[intake.country_hq]}
        </p>
        <p className="mt-3 text-sm text-slate-700 line-clamp-3">{intake.description}</p>
      </header>

      <Section id="lights" title={dict.incident.result.section_lights}>
        <div className="grid gap-4 sm:grid-cols-3">
          {regimes.map((r) => {
            const label = regimeLabel(dict, r.regime)
            return (
              <div
                key={r.regime}
                data-testid={`traffic-${r.regime}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[r.trafficLight]}`} aria-hidden />
                    {label.code}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ${LIGHT_STYLE[r.trafficLight]}`}
                  >
                    {dict.incident.result.verdict[r.applicable]}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  {label.name} · {label.lawShort}
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  {dict.incident.result.traffic[r.trafficLight]}
                </p>
                <p className="text-sm leading-snug text-slate-800">
                  {renderInlineMd(r.reasoningMd.split('\n')[0])}
                </p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section id="deadlines" title={dict.incident.result.section_deadlines}>
        {relevant.length === 0 ? (
          <p className="text-sm text-slate-600">{dict.incident.result.none_relevant}</p>
        ) : (
          <div className="space-y-4">
            {relevant.map((r) => {
              const label = regimeLabel(dict, r.regime)
              return (
                <div
                  key={r.regime}
                  data-testid={`deadline-${r.regime}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {label.code} · {label.lawShort}
                    </h4>
                    <a
                      href={r.authority.portal_url}
                      className="text-xs font-medium text-indigo-600 underline-offset-2 hover:underline"
                      rel="noreferrer"
                    >
                      {r.authority.name}
                    </a>
                  </div>
                  <ul className="space-y-2">
                    {r.absoluteDeadlines.map((d) => (
                      <li
                        key={d.key}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {d.label ?? d.key}
                          </p>
                          <p className="text-xs text-slate-500">
                            {dict.incident.result.relative}: {formatStageHours(dict, d.hours)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {dict.incident.result.due_at}
                          </p>
                          <p className="font-mono text-sm text-slate-900">
                            {fmtDateTime(d.due_at, record.locale)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-3 grid gap-1 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="inline font-semibold text-slate-700">
                        {dict.incident.result.authority}:{' '}
                      </dt>
                      <dd className="inline">{r.authority.name}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">
                        {t(dict, 'report.clock.channel')}:{' '}
                      </dt>
                      <dd className="inline">{r.authority.format ?? '—'}</dd>
                    </div>
                  </dl>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section id="draft" title={dict.incident.result.section_draft}>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dict.incident.result.authority}
              </p>
              <p className="text-sm font-medium text-slate-800">{triage.draft.authorityName}</p>
              {triage.draft.portalUrl && (
                <a
                  href={triage.draft.portalUrl}
                  className="text-xs text-indigo-600 underline-offset-2 hover:underline"
                  rel="noreferrer"
                >
                  {triage.draft.portalUrl}
                </a>
              )}
            </div>
            {showChrome && (
              <CopyDraftButton
                text={`${triage.draft.subject}\n\n${triage.draft.body}`}
                label={dict.incident.result.copy_draft}
                copiedLabel={dict.incident.result.copied}
              />
            )}
          </div>
          <p className="mb-2 text-sm font-semibold text-slate-900">{triage.draft.subject}</p>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {triage.draft.body}
          </pre>
        </div>
      </Section>

      <Section id="checklist" title={dict.incident.result.section_checklist}>
        <ul className="space-y-2">
          {triage.checklist.map((item) => {
            const raw = (dict.incident.checklist as Record<string, string>)[item.labelKey] ?? item.labelKey
            const label = item.vars
              ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(item.vars?.[k] ?? `{${k}}`))
              : raw
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    item.required
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                      : 'bg-slate-50 text-slate-500 ring-1 ring-slate-300/50'
                  }`}
                >
                  {item.required ? dict.incident.result.required : dict.incident.result.optional}
                </span>
                <span className="text-slate-800">{label}</span>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section id="limits" title={dict.incident.result.section_limits}>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="leading-relaxed">{renderInlineMd(dict.incident.result.limits_body)}</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {regimes.map((r) => (
              <li key={r.regime}>
                <span className="font-mono">{r.rulesVersionLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
        {dict.incident.result.disclaimer_footer}
      </footer>

      {showChrome && (
        <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
          {process.env.SITE_URL && (
            <a
              href={`/.netlify/functions/render-pdf?token=${token}&kind=incident`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {dict.incident.result.download_pdf}
            </a>
          )}
          <a
            href={`?print=1`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {dict.incident.result.print}
          </a>
        </div>
      )}
    </article>
  )
}
