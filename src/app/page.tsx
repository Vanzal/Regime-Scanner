import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Dictionary, type Locale } from '@/i18n'
import { WaitlistForm } from '@/components/site/waitlist-form'
import { SampleReportTabs } from '@/components/site/sample-report-tabs'
import { CookieBanner } from '@/components/site/cookie-banner'
import { SiteFooter } from '@/components/site/site-footer'

export const dynamic = 'force-dynamic'

const SECTION_CLS = 'mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24'
const H2_CLS = 'text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl'

/** dezentes Netz-/Knotenlinien-Motiv hinter dem Hero (nur SVG/CSS). */
function NetworkMotif() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <path d="M0 480 L180 380 L340 470 L520 350 L700 430 L900 300 L1080 380 L1200 280" />
        <path d="M60 600 L220 500 L400 560 L580 460 L760 520 L960 420 L1200 500" />
        <path d="M180 380 L220 500 M520 350 L580 460 M900 300 L960 420 M340 470 L400 560" />
        <path d="M180 380 L520 350 M520 350 L900 300 M900 300 L1200 280" />
      </g>
      <g fill="currentColor">
        {[
          [180, 380], [340, 470], [520, 350], [700, 430], [900, 300], [1080, 380],
          [220, 500], [400, 560], [580, 460], [760, 520], [960, 420],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 4 : 2.5} />
        ))}
      </g>
    </svg>
  )
}

function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-slate-50 ${className}`}>
      Nexus<span className="text-cyan-400">Scope</span>
    </span>
  )
}

function WaitlistSection({ dict, id }: { dict: Dictionary; id: string }) {
  return (
    <section id={id} className="border-t border-slate-800 bg-slate-950/60">
      <div className={`${SECTION_CLS} max-w-3xl`}>
        <h2 className={H2_CLS}>{dict.site.waitlist.title}</h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400">{dict.site.waitlist.subtitle}</p>
        <div className="mt-8" data-testid="waitlist-form">
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
    <div className="bg-[#0B1120] text-slate-200">
      {/* ── 1 · Hero ─────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 text-slate-500">
          <NetworkMotif />
        </div>
        <div className="relative">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
            <Brand className="text-lg" />
            <div className="hidden gap-8 text-sm font-medium text-slate-400 md:flex">
              <a href="#how" className="transition hover:text-cyan-300">{s.nav.how}</a>
              <a href="#preview" className="transition hover:text-cyan-300">{s.nav.preview}</a>
              <a href="#features" className="transition hover:text-cyan-300">{s.nav.features}</a>
              <a href="#faq" className="transition hover:text-cyan-300">{s.nav.faq}</a>
            </div>
          </nav>

          <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
            <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300">
              {s.hero.badge}
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl sm:leading-tight">
              {s.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">{s.hero.subtitle}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#waitlist"
                className="rounded-lg bg-cyan-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
              >
                {s.hero.cta}
              </a>
              <p className="text-xs text-slate-500">{s.hero.note}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2 · Problem ─────────────────────────────────────────────────── */}
      <section className="border-t border-slate-800 bg-slate-950/40">
        <div className={SECTION_CLS}>
          <h2 className={H2_CLS}>{s.problem.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-400">{s.problem.body}</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {s.problem.points.map((point, i) => (
              <li key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm font-medium leading-relaxed text-slate-300">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3 · How it works ────────────────────────────────────────────── */}
      <section id="how" className="border-t border-slate-800">
        <div className={SECTION_CLS}>
          <h2 className={H2_CLS}>{s.how.title}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {s.how.steps.map((step, i) => (
              <li key={i} className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-6" data-testid={`how-step-${i + 1}`}>
                <span className="font-mono text-sm font-bold text-cyan-400">0{i + 1}</span>
                <h3 className="mt-3 text-base font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 4 · Sample report preview ───────────────────────────────────── */}
      <section id="preview" className="border-t border-slate-800 bg-slate-950/40">
        <div className={SECTION_CLS}>
          <h2 className={H2_CLS}>{s.preview.title}</h2>
          <p className="mt-3 max-w-2xl text-base text-slate-400">{s.preview.subtitle}</p>
          <div className="mt-10">
            <SampleReportTabs dict={dict} />
          </div>
        </div>
      </section>

      {/* ── 5 · Features ────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-slate-800">
        <div className={SECTION_CLS}>
          <h2 className={H2_CLS}>{s.features.title}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.features.cards.map((card, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6" data-testid={`feature-${i + 1}`}>
                <h3 className="text-base font-semibold text-slate-100">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 · Trust ───────────────────────────────────────────────────── */}
      <section className="border-t border-slate-800 bg-slate-950/40">
        <div className={SECTION_CLS}>
          <h2 className={H2_CLS}>{s.trust.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-400">{s.trust.body}</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {s.trust.points.map((point, i) => (
              <li key={i} className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-300">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 7 · Waitlist CTA ────────────────────────────────────────────── */}
      <WaitlistSection dict={dict} id="waitlist" />

      {/* ── 8 · FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-slate-800">
        <div className={`${SECTION_CLS} max-w-3xl`}>
          <h2 className={H2_CLS}>{s.faq.title}</h2>
          <div className="mt-8 space-y-3" data-testid="faq-list">
            {s.faq.items.map((item, i) => (
              <details key={i} className="group rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4" data-testid={`faq-item-${i + 1}`}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 marker:hidden">
                  <span className="mr-2 text-cyan-400 group-open:hidden">+</span>
                  <span className="mr-2 hidden text-cyan-400 group-open:inline">–</span>
                  {item.q}
                </summary>
                <p className="mt-3 pl-6 text-sm leading-relaxed text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Zweite Warteliste-Verankerung: derselbe Abschnitt direkt über dem Footer. */}
      <WaitlistSection dict={dict} id="waitlist-bottom" />

      {/* ── 9 · Footer ──────────────────────────────────────────────────── */}
      <SiteFooter dict={dict} locale={locale} />

      <CookieBanner dict={dict} />
    </div>
  )
}
