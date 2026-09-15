'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Locale } from '@/i18n'
import { CloseIcon, MenuIcon } from './icons'
import { LangSwitch } from './lang-switch'

type NavLink = { href: string; label: string }

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-accent)]'

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
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const navId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const firstLink = mobileNavRef.current?.querySelector<HTMLElement>('a, button')
    firstLink?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ns-border)] bg-[color-mix(in_oklch,var(--ns-bg)_88%,transparent)] backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6"
        aria-label="Primary"
      >
        {children}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {trailing}
          <button
            ref={menuButtonRef}
            type="button"
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ns-radius)] border border-[var(--ns-border)] text-[var(--ns-fg)] ${FOCUS_RING} lg:hidden`}
            aria-expanded={open}
            aria-controls={navId}
            aria-label={open ? closeLabel : menuLabel}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {open ? (
        <div id={navId} ref={mobileNavRef} className="border-t border-[var(--ns-border)] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-[var(--ns-radius)] px-2 py-2.5 text-[var(--ns-fg-muted)] hover:bg-[var(--ns-ghost)] hover:text-[var(--ns-fg)] ${FOCUS_RING}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={contactHref}
              className={`rounded-[var(--ns-radius)] px-2 py-2.5 text-[var(--ns-fg-muted)] hover:bg-[var(--ns-ghost)] hover:text-[var(--ns-fg)] ${FOCUS_RING}`}
              onClick={() => setOpen(false)}
            >
              {contactLabel}
            </Link>
            <div className="px-2 pt-3">
              <LangSwitch locale={locale} label={langLabel} />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
