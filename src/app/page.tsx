import { cookies } from 'next/headers'
import Link from 'next/link'
import { ShieldCheck, Clock3, FileSearch, Scale, FileDown, Server } from 'lucide-react'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { isProductReady } from '@/lib/flags'
import { buildAllSampleReports, buildSampleReport } from '@/lib/sample-reports'
import { WaitlistForm } from '@/components/site/waitlist-form'
import { SampleReportExplorer } from '@/components/site/sample-report-explorer'
import { HeroReportCard } from '@/components/site/hero-report-card'
import { SiteShell } from '@/components/site/site-shell'

export const dynamic = 'force-dynamic'

const SECTION = 'mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20'
const H2 = 'font-display text-2xl tracking-tight text-[var(--ns-fg)] sm:text-3xl'

const FEATURE_ICONS = [Scale, Clock3, FileSearch, ShieldCheck, FileDown, Server]

function DeadlineInstruments({ dict }: { dict: Dictionary }) {
  const clocks = [
    { label: '24 h', caption: dict.site.hero.clock_early },
    { label: '72 h', caption: dict.site.hero.clock_incident },
    { label: '30 d', caption: dict.site.hero.clock_final },
  ]
  return (
    <aside aria-label="Reporting clocks" className="ns-reveal ns-reveal-d2 grid grid-cols-3 gap-2 sm:gap-3">
      {clocks.map((c, i) => (
        <div
          key={c.label}
          className="ns-clock ns-clock-lit flex flex-col justify-between p-3 sm:p-4"
          style={{ animationDelay: `${0.2 + i * 0.1}s` }}
        >
          <span className="font-instrument text-[10px] uppercase tracking-[0.14em] opacity-70">{c.caption}</span>
          <span className="mt-4 font-display text-lg leading-none sm:mt-5 sm:text-2xl">{c.label}</span>
        </div>
      ))}
    </aside>
  )
}

function WaitlistSection({ dict, id }: { dict: Dictionary; id: string }) {
  return (
    <section id={id} className="border-t border-[var(--ns-border)] bg-[var(--ns-bg-panel)]" aria-labelledby="early-access-heading">
      <div className={`${SECTION} max-w-3xl`}>
        <h2 id="early-access-heading" className={H2}>{dict.site.waitlist.title}</h2>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-[var(--ns-fg-muted)]">
          {dict.site.waitlist.subtitle}
        </p>
        <div className="ns-card mt-8 p-4 sm:p-8" data-testid="waitlist-form">
          <WaitlistForm dict={dict} />
        </div>
      </div>
    </section>
  )
}

export default async function LandingPage() {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const s = dict.site
  const productReady = isProductReady()
  const sampleReports = buildAllSampleReports()
  const heroReport = buildSampleReport('mittelstand-de')
  const primaryHref = productReady ? '/intake' : '#waitlist'
  const primaryLabel = productReady ? s.hero.scan_cta : s.hero.cta

  return (
    <SiteShell dict={dict} locale={locale} productReady={productReady}>
      {/* 1 · Hero */}
      <header className="relative overflow-hidden border-b border-[var(--ns-border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--ns-accent)_12%,transparent),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
          <div className="min-w-0 max-w-2xl">
            <p className="ns-reveal font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
              {s.hero.badge}
            </p>
            <h1 className="ns-reveal ns-reveal-d1 mt-4 font-display text-[1.65rem] leading-[1.15] tracking-tight sm:mt-5 sm:text-4xl md:text-[2.7rem] md:leading-[1.12]">
              {s.hero.title}
            </h1>
            <p className="ns-reveal ns-reveal-d2 mt-5 max-w-prose text-base leading-relaxed text-[var(--ns-fg-muted)] sm:mt-6 sm:text-lg">
              {s.hero.subtitle}
            </p>
            <div className="ns-reveal ns-reveal-d3 mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link href={primaryHref} className="ns-btn-primary w-full sm:w-auto">
                {primaryLabel}
              </Link>
              <Link href="#preview" className="ns-btn-secondary w-full sm:w-auto">
                {s.hero.cta_secondary}
              </Link>
            </div>
            <p className="mt-4 text-sm text-[var(--ns-fg-dim)]">{s.hero.note}</p>
            <div className="mt-7 max-w-xl sm:mt-8">
              <DeadlineInstruments dict={dict} />
            </div>
          </div>
          <div className="min-w-0">
            <HeroReportCard report={heroReport} dict={dict} />
          </div>
        </div>
      </header>

      {/* 2 · How it works */}
      <section id="how" className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)]">
        <div className={SECTION}>
          <h2 className={H2}>{s.how.title}</h2>
          <ol className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
            {s.how.steps.map((step, i) => (
              <li
                key={step.title}
                className="ns-card p-5 sm:p-6"
                data-testid={`how-step-${i + 1}`}
              >
                <span className="font-instrument text-sm font-semibold text-[var(--ns-accent)]">
                  STEP {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)] sm:text-base">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3 · Example report */}
      <section id="preview" className="border-b border-[var(--ns-border)]">
        <div className={SECTION}>
          <div className="max-w-2xl">
            <h2 className={H2}>{s.preview.title}</h2>
            <p className="mt-3 text-base text-[var(--ns-fg-muted)] sm:text-lg">{s.preview.subtitle}</p>
          </div>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-[var(--ns-radius)] border border-[var(--ns-border)] bg-[var(--ns-border)] sm:grid-cols-3">
            {s.preview.outputs.map((output, i) => (
              <li
                key={output.label}
                className="bg-[var(--ns-bg-elevated)] px-4 py-4 sm:px-5"
                data-testid={`preview-output-${i + 1}`}
              >
                <p className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-2 text-sm font-semibold tracking-tight sm:text-base">{output.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{output.hint}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 min-w-0">
            <SampleReportExplorer reports={sampleReports} dict={dict} />
          </div>
        </div>
      </section>

      {/* 4 · Why NexusScope (features + problem context) */}
      <section id="features" className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)]">
        <div className={SECTION}>
          <div className="max-w-3xl">
            <h2 className={H2}>{s.features.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--ns-fg-muted)] sm:text-lg">{s.problem.lead}</p>
            <p className="mt-4 border-l-2 border-[var(--ns-accent)] pl-4 text-sm font-semibold leading-snug tracking-tight sm:text-base">
              {s.problem.emphasis}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.features.cards.map((card, i) => {
              const Icon = FEATURE_ICONS[i] ?? ShieldCheck
              return (
                <div key={card.title} className="ns-card p-5" data-testid={`feature-${i + 1}`}>
                  <Icon className="h-5 w-5 text-[var(--ns-accent)]" aria-hidden />
                  <h3 className="mt-4 text-base font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{card.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5 · Designed for (+ preserved trust signals) */}
      <section id="designed-for" className="border-b border-[var(--ns-border)]" aria-labelledby="designed-for-heading">
        <div className={SECTION}>
          <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
            {s.proof.eyebrow}
          </p>
          <h2 id="designed-for-heading" className={`mt-3 ${H2}`}>
            {s.proof.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--ns-fg-muted)]">{s.proof.body}</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {s.proof.placeholders.map((label) => (
              <li
                key={label}
                className="flex min-h-16 items-center justify-center rounded-[var(--ns-radius)] border border-dashed border-[var(--ns-border-strong)] px-3 text-center text-xs text-[var(--ns-fg-dim)]"
              >
                {label}
              </li>
            ))}
          </ul>

          <div className="ns-card mt-10 p-5 sm:p-8" aria-labelledby="trust-heading">
            <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
              {s.trust.eyebrow}
            </p>
            <h3 id="trust-heading" className="mt-3 font-display text-xl tracking-tight sm:text-2xl">
              {s.trust.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ns-fg-muted)] sm:text-base">{s.trust.body}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {s.trust.points.map((point) => (
                <li key={point} className="border-t border-[var(--ns-border)] pt-3 text-sm font-medium leading-snug">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6 · Early access */}
      <WaitlistSection dict={dict} id="waitlist" />

      {/* Secondary: FAQ */}
      <section id="faq" className="border-b border-[var(--ns-border)]">
        <div className={`${SECTION} max-w-3xl`}>
          <h2 className={H2}>{s.faq.title}</h2>
          <div className="mt-8 border-t border-[var(--ns-border)]" data-testid="faq-list">
            {s.faq.items.map((item, i) => (
              <details
                key={item.q}
                className="group border-b border-[var(--ns-border)] py-4"
                data-testid={`faq-item-${i + 1}`}
              >
                <summary className="cursor-pointer list-none text-sm font-semibold tracking-tight marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)] sm:text-base">
                  <span className="mr-3 inline-block w-4 font-instrument text-[var(--ns-accent)] group-open:hidden" aria-hidden>+</span>
                  <span className="mr-3 hidden w-4 font-instrument text-[var(--ns-accent)] group-open:inline" aria-hidden>–</span>
                  {item.q}
                </summary>
                <p className="mt-3 pl-7 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary: final conversion band */}
      <section className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-ink)]" aria-labelledby="final-cta-heading">
        <div className={`${SECTION} max-w-3xl text-center`}>
          <h2 id="final-cta-heading" className="font-display text-2xl tracking-tight text-[var(--ns-fg)] sm:text-3xl">{s.final_cta.title}</h2>
          <p className="mx-auto mt-4 max-w-prose text-sm leading-relaxed text-[var(--ns-fg-muted)] sm:text-base">
            {s.final_cta.body}
          </p>
          <Link href="#waitlist" className="ns-btn-primary mt-8 inline-flex">
            {s.final_cta.cta}
          </Link>
        </div>
      </section>
    </SiteShell>
  )
}
