import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center text-[var(--ns-fg)]">
      <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">404</p>
      <h1 className="mt-3 font-display text-2xl tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-[var(--ns-fg-muted)]">
        This link does not match a published NexusScope page or report token.
      </p>
      <Link href="/" className="ns-btn-primary mt-8">
        Back to NexusScope
      </Link>
    </main>
  )
}
