'use client'

/**
 * Re-opens the functional cookie notice (CookieBanner) by clearing the
 * local acknowledgement flag and dispatching a custom event.
 */
export function CookieSettingsLink({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  const openSettings = () => {
    try {
      localStorage.removeItem('nexuscookieok')
    } catch {
      // ignore storage failures
    }
    window.dispatchEvent(new CustomEvent('nexus:cookie-settings'))
  }

  return (
    <button type="button" onClick={openSettings} className={`cursor-pointer text-left ${className}`}>
      {label}
    </button>
  )
}
