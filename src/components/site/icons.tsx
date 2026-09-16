/** Small inline icons — avoids pulling lucide-react into marketing client islands. */

const svg = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function MenuIcon({ className }: { className?: string }) {
  return (
    <svg {...svg} className={className}>
      <path d="M4 5h16M4 12h16M4 19h16" />
    </svg>
  )
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg {...svg} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function SunIcon({ className }: { className?: string }) {
  return (
    <svg {...svg} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function MoonIcon({ className }: { className?: string }) {
  return (
    <svg {...svg} className={className}>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  )
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg {...svg} className={className}>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  )
}
