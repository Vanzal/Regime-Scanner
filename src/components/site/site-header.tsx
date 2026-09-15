import Link from 'next/link'
import type { Dictionary, Locale } from '@/i18n'
import { isProductReady } from '@/lib/flags'
import { BrandMark } from './brand-mark'
import { LangSwitch } from './lang-switch'
import { SiteHeaderShell } from './site-header-shell'
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

  return (
    <SiteHeaderShell
      links={links}
      contactHref="/contact"
      contactLabel={n.contact}
      menuLabel={n.menu}
      closeLabel={n.close}
      locale={locale}
      langLabel={dict.site.footer.lang_label}
      trailing={
        <>
          <div className="hidden sm:block">
            <LangSwitch locale={locale} label={dict.site.footer.lang_label} />
          </div>
          <ThemeToggle label={dict.site.theme.toggle} />
          <Link href={primaryHref} className="ns-btn-primary !min-h-0 px-3 py-2 text-xs sm:text-sm">
            {primaryLabel}
          </Link>
        </>
      }
    >
      <BrandMark />
      <div className="hidden items-center gap-6 text-sm font-medium text-[var(--ns-fg-muted)] lg:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:text-[var(--ns-fg)]">
            {link.label}
          </Link>
        ))}
      </div>
    </SiteHeaderShell>
  )
}
