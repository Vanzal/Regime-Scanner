import Link from 'next/link'

export function BrandMark({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--ns-accent)] font-instrument text-[11px] font-semibold text-[var(--ns-accent-fg)]"
      >
        NS
      </span>
      <span className="truncate font-display text-sm tracking-tight text-[var(--ns-fg)] sm:text-base">NexusScope</span>
    </Link>
  )
}
