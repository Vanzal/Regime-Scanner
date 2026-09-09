import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { WaitlistForm } from '@/components/site/waitlist-form'
import { SampleReportTabs } from '@/components/site/sample-report-tabs'
import { CookieBanner } from '@/components/site/cookie-banner'
import { SiteFooter } from '@/components/site/site-footer'

export const dynamic = 'force-dynamic'

const SECTION = 'mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20'
const H2 = 'font-display text-2xl tracking-tight text-[var(--ns-fg)] sm:text-3xl'

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display text-sm tracking-tight text-[var(--ns-fg)] sm:text-base ${className}`}>
      NexusScope
    </span>
  )
}

/** Signature instrument: lit deadline cells + one ghost (unclear). */
function DeadlineInstruments() {
  const clocks = [
    { label: '24 h', state: 'lit' as const, caption: 'Early warning' },
    { label: '72 h', state: 'lit' as const, caption: 'Incident report' },
    { label: '30 d', state: 'ghost' as const, caption: 'Final report' },
  ]
  return (
    <aside
      aria-label="Reporting clocks"
      className="ns-reveal ns-reveal-d2 grid grid-cols-3 gap-2 sm:gap-3 lg:w-[20rem]"
    >
      {clocks.map((c, i) => (
        <div
          key={c.label}
          className={`ns-clock ns-clock-lit flex flex-col justify-between p-3 sm:p-4 ${c.state === 'ghost' ? 'ns-clock--ghost' : ''}`}
          style={{ animationDelay: `${0.2 + i * 0.1}s` }}
        >
          <span className="font-instrument text-[10px] uppercase tracking-[0.14em] opacity-70">{c.caption}</span>
          <span className="mt-5 font-display text-xl leading-none sm:text-2xl">{c.label}</span>
        </div>
      ))}
    </aside>
  )
}

function WaitlistSection({ dict, id }: { dict: Dictionary; id: string }) {
  return (
    <section id={id} className="border-t border-[var(--ns-border-strong)] bg-[var(--ns-bg-panel)]">
      <div className={`${SECTION} max-w-3xl`}>
        <h2 className={H2}>{dict.site.waitlist.title}</h2>
        <p className="font-reading mt-3 max-w-prose text-base leading-relaxed text-[var(--ns-fg-muted)]">
          {dict.site.waitlist.subtitle}
        </p>
        <div className="mt-8 border border-[var(--ns-border-strong)] bg-[var(--ns-bg-elevated)] p-5 sm:p-8" data-testid="waitlist-form">
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

  return (
    <div className="bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      {/* ── 1 · Hero ─────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b-2 border-[var(--ns-fg)]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b border-[var(--ns-border)] px-4 py-4 sm:px-6">
          <BrandMark />
          <div className="hidden items-center gap-7 text-sm font-medium text-[var(--ns-fg-muted)] md:flex">
            <a href="#how" className="hover:text-[var(--ns-fg)]">{s.nav.how}</a>
            <a href="#preview" className="hover:text-[var(--ns-fg)]">{s.nav.preview}</a>
            <a href="#features" className="hover:text-[var(--ns-fg)]">{s.nav.features}</a>
            <a href="#faq" className="hover:text-[var(--ns-fg)]">{s.nav.faq}</a>
          </div>
          <a href="#waitlist" className="ns-btn-primary !min-h-0 px-3 py-2 text-xs sm:text-sm">
            {s.hero.cta}
          </a>
        </nav>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-[minmax(0,1.25fr)_auto] lg:items-end lg:gap-14">
          <div className="max-w-2xl">
            <p className="ns-reveal font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
              {s.hero.badge}
            </p>
            <h1 className="ns-reveal ns-reveal-d1 mt-5 font-display text-[1.85rem] leading-[1.15] tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
              {s.hero.title}
            </h1>
            <p className="font-reading ns-reveal ns-reveal-d2 mt-6 max-w-prose text-base leading-relaxed text-[var(--ns-fg-muted)] sm:text-lg">
              {s.hero.subtitle}
            </p>
            <div className="ns-reveal ns-reveal-d3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <a href="#waitlist" className="ns-btn-primary">
                {s.hero.cta}
              </a>
              <p className="text-sm text-[var(--ns-fg-dim)]">{s.hero.note}</p>
            </div>
          </div>
          <DeadlineInstruments />
        </div>
      </header>

      {/* ── 2 · Problem ─────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--ns-border)]">
        <div className={SECTION}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            <h2 className={H2}>{s.problem.title}</h2>
            <div>
              <p className="font-reading text-base leading-relaxed text-[var(--ns-fg-muted)] sm:text-lg">
                {s.problem.lead}
              </p>
              <p className="mt-5 border-l-2 border-[var(--ns-accent)] pl-4 text-sm font-semibold leading-snug tracking-tight sm:text-base">
                {s.problem.emphasis}
              </p>
              <ul className="mt-8 space-y-0 border-t border-[var(--ns-border-strong)]">
                {s.problem.points.map((point, i) => (
                  <li
                    key={i}
                    className="border-b border-[var(--ns-border)] py-3.5 text-sm leading-relaxed text-[var(--ns-fg-muted)] sm:text-base"
                  >
                    <span className="font-medium text-[var(--ns-fg)]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · How it works ────────────────────────────────────────────── */}
      <section id="how" className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-elevated)]">
        <div className={SECTION}>
          <h2 className={H2}>{s.how.title}</h2>
          <ol className="mt-10 space-y-0 border-t-2 border-[var(--ns-fg)]">
            {s.how.steps.map((step, i) => (
              <li
                key={i}
                className="grid gap-3 border-b border-[var(--ns-border)] py-7 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-10"
                data-testid={`how-step-${i + 1}`}
              >
                <span className="font-instrument text-sm font-semibold text-[var(--ns-fg-dim)]">
                  STEP {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="font-reading mt-2 max-w-prose text-sm leading-relaxed text-[var(--ns-fg-muted)] sm:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 4 · Sample report preview ───────────────────────────────────── */}
      <section id="preview" className="border-b border-[var(--ns-border)]">
        <div className={SECTION}>
          <div className="max-w-2xl">
            <h2 className={H2}>{s.preview.title}</h2>
            <p className="font-reading mt-3 text-base text-[var(--ns-fg-muted)] sm:text-lg">{s.preview.subtitle}</p>
          </div>
          <ul className="mt-8 grid gap-px border border-[var(--ns-border-strong)] bg-[var(--ns-border)] sm:grid-cols-3">
            {s.preview.outputs.map((output, i) => (
              <li
                key={i}
                className="bg-[var(--ns-bg-elevated)] px-4 py-4 sm:px-5"
                data-testid={`preview-output-${i + 1}`}
              >
                <p className="font-instrument text-[11px] uppercase tracking-[0.14em] text-[var(--ns-fg-dim)]">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-2 text-sm font-semibold tracking-tight sm:text-base">{output.label}</p>
                <p className="font-reading mt-1.5 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{output.hint}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <SampleReportTabs dict={dict} />
          </div>
        </div>
      </section>

      {/* ── 5 · Features ────────────────────────────────────────────────── */}
      <section id="features" className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-panel)]">
        <div className={SECTION}>
          <h2 className={H2}>{s.features.title}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {s.features.cards.map((card, i) => (
              <div
                key={i}
                className="border-t border-[var(--ns-border-strong)] pt-4"
                data-testid={`feature-${i + 1}`}
              >
                <h3 className="text-base font-semibold tracking-tight">{card.title}</h3>
                <p className="font-reading mt-2 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 · Trust ───────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--ns-border)]" aria-labelledby="trust-heading">
        <div className={SECTION}>
          <div className="max-w-3xl border border-[var(--ns-border-strong)] bg-[var(--ns-bg-elevated)] p-6 sm:p-8">
            <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
              {s.trust.eyebrow}
            </p>
            <h2 id="trust-heading" className="mt-3 font-display text-xl tracking-tight sm:text-2xl">
              {s.trust.title}
            </h2>
            <p className="font-reading mt-3 text-sm leading-relaxed text-[var(--ns-fg-muted)] sm:text-base">
              {s.trust.body}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {s.trust.points.map((point, i) => (
                <li
                  key={i}
                  className="border-t border-[var(--ns-border)] pt-3 text-sm font-medium leading-snug"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 7 · Waitlist CTA ────────────────────────────────────────────── */}
      <WaitlistSection dict={dict} id="waitlist" />

      {/* ── 8 · FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-[var(--ns-border)]">
        <div className={`${SECTION} max-w-3xl`}>
          <h2 className={H2}>{s.faq.title}</h2>
          <div className="mt-8 border-t-2 border-[var(--ns-fg)]" data-testid="faq-list">
            {s.faq.items.map((item, i) => (
              <details
                key={i}
                className="group border-b border-[var(--ns-border)] py-4"
                data-testid={`faq-item-${i + 1}`}
              >
                <summary className="cursor-pointer list-none text-sm font-semibold tracking-tight marker:hidden sm:text-base">
                  <span className="mr-3 inline-block w-4 font-instrument text-[var(--ns-accent)] group-open:hidden">+</span>
                  <span className="mr-3 hidden w-4 font-instrument text-[var(--ns-accent)] group-open:inline">–</span>
                  {item.q}
                </summary>
                <p className="font-reading mt-3 pl-7 text-sm leading-relaxed text-[var(--ns-fg-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <WaitlistSection dict={dict} id="waitlist-bottom" />

      <SiteFooter dict={dict} locale={locale} />
      <CookieBanner dict={dict} />
    </div>
  )
}
