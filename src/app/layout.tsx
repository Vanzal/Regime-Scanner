import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { HtmlLang } from '@/components/site/html-lang'
import { siteMetadataBase } from '@/lib/site-url'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
  preload: true,
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-face',
  weight: ['400', '500', '600'],
  preload: true,
})

const SITE_TITLE = 'NexusScope — DACH Regulatory Readiness Intelligence'
const SITE_DESCRIPTION =
  'NexusScope helps DACH companies understand which regulatory reporting regimes may apply, why they apply, and what to do next.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1c2e' },
    { media: '(prefers-color-scheme: light)', color: '#f7f9fc' },
  ],
}

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: SITE_TITLE,
    template: '%s — NexusScope',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'NexusScope',
  keywords: [
    'NIS2',
    'NIS2UmsuCG',
    'NISG',
    'ISG',
    'DACH',
    'cyber reporting',
    'regulatory readiness',
    'compliance',
  ],
  authors: [{ name: 'NexusScope' }],
  creator: 'NexusScope',
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: 'NexusScope',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body
        className="min-h-screen antialiased"
        style={{
          fontFamily: 'var(--font-sans-face), var(--font-sans)',
          ['--font-display' as string]: 'var(--font-sans-face), Inter, sans-serif',
          ['--font-sans' as string]: 'var(--font-sans-face), Inter, sans-serif',
          ['--font-reading' as string]: 'var(--font-sans-face), Inter, sans-serif',
          ['--font-instrument' as string]: 'var(--font-mono-face), "IBM Plex Mono", monospace',
        }}
      >
        <HtmlLang />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
