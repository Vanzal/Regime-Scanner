import Link from 'next/link'

/** Footer / chrome link to the Cookie Settings page (`/cookie-settings`). */
export function CookieSettingsLink({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <Link href="/cookie-settings" className={className} data-testid="cookie-settings-link">
      {label}
    </Link>
  )
}
