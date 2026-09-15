'use client'

import { useEffect, useId, useRef, useState } from 'react'
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
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const navId = useId()
  const n = dict.site.nav
  const links: NavLink[] = [
    { href: '/#features', label: n.features },
    { href: '/#how', label: n.how },
    { href: '/#preview', label: n.preview },
    { href: '/pricing', label: n.pricing },
    { href: '/#faq', label: n.faq },
  ]

  const primaryHref = productReady ? '/intake' : '/#waitlist'
  const primaryLabel = productReady ? n.scan : n.waitlist

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
        <BrandMark className="min-w-0 shrink" />
        <div className="hidden items-center gap-6 text-sm font-medium text-[var(--ns-fg-muted)] lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[var(--ns-fg)]">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <LangSwitch locale={locale} label={dict.site.footer.lang_label} />
          </div>
          <ThemeToggle label={dict.site.theme.toggle} />
          <Link
            href={primaryHref}
            className="ns-btn-primary max-lg:!hidden min-h-10 px-3 py-2 text-xs sm:text-sm"
          >
            {primaryLabel}
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--ns-border)] text-[var(--ns-fg)] lg:hidden"
            aria-expanded={open}
            aria-controls={navId}
            aria-label={open ? n.close : n.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </nav>
      {open ? (
        <div
          id={navId}
          ref={mobileNavRef}
          className="border-t border-[var(--ns-border)] px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2.5 text-[var(--ns-fg-muted)] hover:bg-[var(--ns-ghost)] hover:text-[var(--ns-fg)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="rounded-md px-2 py-2.5 text-[var(--ns-fg-muted)] hover:bg-[var(--ns-ghost)] hover:text-[var(--ns-fg)]"
              onClick={() => setOpen(false)}
            >
              {n.contact}
            </Link>
            <Link
              href={primaryHref}
              className="ns-btn-primary mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {primaryLabel}
            </Link>
            <div className="pt-3">
              <LangSwitch locale={locale} label={dict.site.footer.lang_label} />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
