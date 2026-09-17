import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { HtmlLang } from '@/components/site/html-lang'
import { JsonLd } from '@/components/site/json-ld'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'
import { CANONICAL_ORIGIN, siteMetadataBase } from '@/lib/site-url'
import { OG_IMAGE_ALT, OG_IMAGE_SIZE, SITE_DESCRIPTION, SITE_TITLE, pathAlternates } from '@/lib/seo'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
  preload: true,
  adjustFontFallback: true,
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-face',
  weight: ['400', '600'],
  preload: false,
  adjustFontFallback: true,
})

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
    url: CANONICAL_ORIGIN,
    siteName: 'NexusScope',
    locale: 'en_GB',
    alternateLocale: ['de_DE'],
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: OG_IMAGE_SIZE.width,
        height: OG_IMAGE_SIZE.height,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: OG_IMAGE_SIZE.width,
        height: OG_IMAGE_SIZE.height,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  alternates: pathAlternates('/'),
  other: {
    'twitter:url': CANONICAL_ORIGIN,
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
        className={`min-h-screen antialiased ${sans.className}`}
        style={{
          fontFamily: 'var(--font-sans-face), var(--font-sans)',
          ['--font-display' as string]: 'var(--font-sans-face), Inter, sans-serif',
          ['--font-sans' as string]: 'var(--font-sans-face), Inter, sans-serif',
          ['--font-reading' as string]: 'var(--font-sans-face), Inter, sans-serif',
          ['--font-instrument' as string]: 'var(--font-mono-face), "IBM Plex Mono", monospace',
        }}
      >
        <JsonLd />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HtmlLang />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
