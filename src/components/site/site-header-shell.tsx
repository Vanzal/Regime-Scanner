'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Locale } from '@/i18n'
import { CloseIcon, MenuIcon } from './icons'
import { LangSwitch } from './lang-switch'

type NavLink = { href: string; label: string }

/** Client island for the mobile drawer only; chrome children stay server-rendered. */
export function SiteHeaderShell({
  children,
  trailing,
  links,
  contactHref,
  contactLabel,
  menuLabel,
  closeLabel,
  locale,
  langLabel,
}: {
  children: ReactNode
  trailing: ReactNode
  links: NavLink[]
  contactHref: string
  contactLabel: string
  menuLabel: string
  closeLabel: string
  locale: Locale
  langLabel: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ns-border)] bg-[color-mix(in_oklch,var(--ns-bg)_88%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Primary">
        {children}
        <div className="flex items-center gap-2">
          {trailing}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ns-border)] text-[var(--ns-fg)] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? closeLabel : menuLabel}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {open ? (
        <div id="mobile-nav" className="border-t border-[var(--ns-border)] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-1 text-[var(--ns-fg-muted)] hover:text-[var(--ns-fg)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={contactHref}
              className="py-1 text-[var(--ns-fg-muted)] hover:text-[var(--ns-fg)]"
              onClick={() => setOpen(false)}
            >
              {contactLabel}
            </Link>
            <div className="pt-2">
              <LangSwitch locale={locale} label={langLabel} />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
