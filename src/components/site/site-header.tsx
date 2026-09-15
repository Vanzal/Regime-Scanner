'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { Dictionary, Locale } from '@/i18n'
import { isProductReady } from '@/lib/flags'
import { BrandMark } from './brand-mark'
import { LangSwitch } from './lang-switch'
import { ThemeToggle } from '@/components/theme/theme-toggle'

type NavLink = { href: string; label: string }

export function SiteHeader({
  dict,
  locale,
  productReady = isProductReady(),
}: {
  dict: Dictionary
  locale: Locale
  productReady?: boolean
}) {
  const [open, setOpen] = useState(false)
  const n = dict.site.nav
  const links: NavLink[] = [
    { href: '/#how', label: n.how },
    { href: '/#preview', label: n.preview },
    { href: '/#features', label: n.features },
    { href: '/pricing', label: n.pricing },
    { href: '/#faq', label: n.faq },
  ]

  const primaryHref = productReady ? '/intake' : '/#waitlist'
  const primaryLabel = productReady ? n.scan : n.waitlist

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ns-border)] bg-[color-mix(in_oklch,var(--ns-bg)_88%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6" aria-label="Primary">
        <BrandMark />
        <div className="hidden items-center gap-6 text-sm font-medium text-[var(--ns-fg-muted)] lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[var(--ns-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <LangSwitch locale={locale} label={dict.site.footer.lang_label} />
          </div>
          <ThemeToggle label={dict.site.theme.toggle} />
          <Link href={primaryHref} className="ns-btn-primary !min-h-9 px-3 py-2 text-xs sm:text-sm">
            {primaryLabel}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ns-radius)] border border-[var(--ns-border)] text-[var(--ns-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? n.close : n.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </nav>
      {open ? (
        <div id="mobile-nav" className="border-t border-[var(--ns-border)] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--ns-radius)] px-2 py-2.5 text-[var(--ns-fg-muted)] hover:bg-[var(--ns-ghost)] hover:text-[var(--ns-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="rounded-[var(--ns-radius)] px-2 py-2.5 text-[var(--ns-fg-muted)] hover:bg-[var(--ns-ghost)] hover:text-[var(--ns-fg)]"
              onClick={() => setOpen(false)}
            >
              {n.contact}
            </Link>
            <div className="px-2 pt-3">
              <LangSwitch locale={locale} label={dict.site.footer.lang_label} />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
