import { getDict } from '@/i18n'

export default function LandingPage() {
  const dict = getDict('de')
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{dict.app.name}</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900">{dict.landing.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600">{dict.landing.intro}</p>
      <div className="mt-8">
        <a
          href="/intake"
          className="inline-block rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {dict.landing.cta}
        </a>
        <span className="ml-3 text-xs text-slate-500">{dict.landing.no_login}</span>
      </div>
      <p className="mt-12 text-xs text-slate-400">{dict.landing.disclaimer_short}</p>
    </main>
  )
}
