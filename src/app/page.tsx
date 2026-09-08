import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { WaitlistForm } from '@/components/site/waitlist-form'
import { SampleReportTabs } from '@/components/site/sample-report-tabs'
import { CookieBanner } from '@/components/site/cookie-banner'
import { SiteFooter } from '@/components/site/site-footer'

export const dynamic = 'force-dynamic'

const SECTION = 'mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28'
const H2 = 'font-display text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl'

/** Soft DACH map silhouette + atmospheric light — calm, not cyber. */
function HeroAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ns-glow-breathe absolute -left-24 top-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,var(--ns-glow),transparent_65%)] blur-2xl" />
      <div className="absolute right-[-12%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_70%)] blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070b14] to-transparent" />
      <svg
        className="absolute bottom-0 right-0 h-[70%] w-[min(720px,90%)] opacity-[0.11] text-slate-300"
        viewBox="0 0 720 520"
        fill="none"
        preserveAspectRatio="xMaxYMax meet"
      >
        {/* Simplified DACH outline as a quiet geographic cue */}
        <path
          d="M210 90 C260 55 320 50 370 70 C410 55 450 70 480 95 C520 90 560 110 575 150 C610 165 635 205 630 250 C650 290 640 340 605 365 C590 410 545 440 495 445 C455 470 405 475 360 455 C310 470 255 455 230 415 C185 405 155 365 160 320 C130 285 135 235 165 205 C155 165 170 120 210 90 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="url(#nsMapFill)"
        />
        <path d="M250 180 L330 150 L410 175 L470 210 L430 270 L350 295 L280 255 Z" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <circle cx="300" cy="210" r="3" fill="currentColor" />
        <circle cx="390" cy="230" r="3" fill="currentColor" />
        <circle cx="450" cy="280" r="3" fill="currentColor" />
        <defs>
          <linearGradient id="nsMapFill" x1="160" y1="70" x2="620" y2="450" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" stopOpacity="0.18" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function BrandMark({ className = '', hero = false }: { className?: string; hero?: boolean }) {
  return (
    <span className={`tracking-tight text-slate-50 ${hero ? 'font-display font-semibold' : 'font-semibold'} ${className}`}>
      Nexus<span className="text-cyan-400">Scope</span>
    </span>
  )
}

function WaitlistSection({ dict, id }: { dict: Dictionary; id: string }) {
  return (
    <section id={id} className="border-t border-[var(--ns-border)] bg-[#080d18]">
      <div className={`${SECTION} max-w-3xl`}>
        <div className="ns-accent-line mb-6 h-px w-24 bg-gradient-to-r from-cyan-400 to-transparent" />
        <h2 className={H2}>{dict.site.waitlist.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">{dict.site.waitlist.subtitle}</p>
        <div className="mt-10 rounded-2xl border border-[var(--ns-border)] bg-[var(--ns-bg-elevated)]/80 p-6 shadow-[0_0_0_1px_rgba(34,211,238,0.04)] sm:p-8" data-testid="waitlist-form">
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
    <div className="bg-[var(--ns-bg)] text-slate-200">
      {/* ── 1 · Hero ─────────────────────────────────────────────────────── */}
      <header className="relative min-h-[100svh] overflow-hidden border-b border-[var(--ns-border)]">
        <HeroAtmosphere />
        <div className="relative flex min-h-[100svh] flex-col">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
            <BrandMark className="text-base sm:text-lg" />
            <div className="hidden gap-8 text-sm font-medium text-slate-400 md:flex">
              <a href="#how" className="transition hover:text-cyan-300">{s.nav.how}</a>
              <a href="#preview" className="transition hover:text-cyan-300">{s.nav.preview}</a>
              <a href="#features" className="transition hover:text-cyan-300">{s.nav.features}</a>
              <a href="#faq" className="transition hover:text-cyan-300">{s.nav.faq}</a>
            </div>
            <a
              href="#waitlist"
              className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15 sm:px-4 sm:text-sm"
            >
              {s.hero.cta}
            </a>
          </nav>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-6">
            <BrandMark hero className="ns-fade-up text-5xl sm:text-6xl md:text-7xl" />
            <h1 className="ns-fade-up ns-fade-up-delay-1 mt-8 max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight text-slate-100 sm:text-3xl md:text-4xl md:leading-snug">
              {s.hero.title}
            </h1>
            <p className="ns-fade-up ns-fade-up-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              {s.hero.subtitle}
            </p>
            <div className="ns-fade-up ns-fade-up-delay-3 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_12px_40px_-12px_rgba(34,211,238,0.55)] transition hover:bg-cyan-300 hover:shadow-[0_16px_48px_-12px_rgba(34,211,238,0.65)]"
              >
                {s.hero.cta}
              </a>
              <p className="text-sm text-slate-500">{s.hero.note}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2 · Problem ─────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-elevated)]/40">
        <div className={SECTION}>
          <h2 className={H2}>{s.problem.title}</h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg">{s.problem.body}</p>
          <ul className="mt-12 grid gap-8 border-t border-[var(--ns-border)] pt-10 sm:grid-cols-3 sm:gap-10">
            {s.problem.points.map((point, i) => (
              <li key={i} className="relative pl-0">
                <span className="font-mono text-xs font-semibold tracking-widest text-cyan-400/80">0{i + 1}</span>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-200 sm:text-base">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3 · How it works ────────────────────────────────────────────── */}
      <section id="how" className="border-b border-[var(--ns-border)]">
        <div className={SECTION}>
          <h2 className={H2}>{s.how.title}</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {s.how.steps.map((step, i) => (
              <li key={i} className="relative" data-testid={`how-step-${i + 1}`}>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-semibold text-cyan-400/90">{i + 1}</span>
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent md:block" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 4 · Sample report preview ───────────────────────────────────── */}
      <section id="preview" className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-elevated)]/40">
        <div className={SECTION}>
          <h2 className={H2}>{s.preview.title}</h2>
          <p className="mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">{s.preview.subtitle}</p>
          <div className="mt-12">
            <SampleReportTabs dict={dict} />
          </div>
        </div>
      </section>

      {/* ── 5 · Features ────────────────────────────────────────────────── */}
      <section id="features" className="border-b border-[var(--ns-border)]">
        <div className={SECTION}>
          <h2 className={H2}>{s.features.title}</h2>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {s.features.cards.map((card, i) => (
              <div key={i} className="border-l border-cyan-400/30 pl-5" data-testid={`feature-${i + 1}`}>
                <h3 className="text-base font-semibold text-slate-100 sm:text-lg">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 · Trust ───────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--ns-border)] bg-[var(--ns-bg-elevated)]/40">
        <div className={SECTION}>
          <h2 className={H2}>{s.trust.title}</h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg">{s.trust.body}</p>
          <ul className="mt-10 space-y-4 border-t border-[var(--ns-border)] pt-8">
            {s.trust.points.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm font-medium text-slate-200 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 7 · Waitlist CTA ────────────────────────────────────────────── */}
      <WaitlistSection dict={dict} id="waitlist" />

      {/* ── 8 · FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-[var(--ns-border)]">
        <div className={`${SECTION} max-w-3xl`}>
          <h2 className={H2}>{s.faq.title}</h2>
          <div className="mt-10 space-y-2" data-testid="faq-list">
            {s.faq.items.map((item, i) => (
              <details
                key={i}
                className="group border-b border-[var(--ns-border)] py-4"
                data-testid={`faq-item-${i + 1}`}
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 marker:hidden sm:text-base">
                  <span className="mr-3 inline-block w-3 font-mono text-cyan-400 group-open:hidden">+</span>
                  <span className="mr-3 hidden w-3 font-mono text-cyan-400 group-open:inline">–</span>
                  {item.q}
                </summary>
                <p className="mt-3 pl-6 text-sm leading-relaxed text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Second waitlist anchor above the footer */}
      <WaitlistSection dict={dict} id="waitlist-bottom" />

      {/* ── 9 · Footer ──────────────────────────────────────────────────── */}
      <SiteFooter dict={dict} locale={locale} />

      <CookieBanner dict={dict} />
    </div>
  )
}
