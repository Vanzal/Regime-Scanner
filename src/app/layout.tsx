import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { localeFromCookie } from '@/i18n'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { siteMetadataBase } from '@/lib/site-url'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-face',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: 'NexusScope – Cyber-reporting & compliance orientation for the DACH region',
    template: '%s – NexusScope',
  },
  description:
    'Which cyber-incident reporting duties apply to your company? NexusScope maps your profile against the German, Austrian and Swiss regimes (NIS2UmsuCG, NISG 2024, ISG) – with reporting deadlines and a prioritised gap list.',
  openGraph: {
    title: 'NexusScope – Know which reporting regimes apply before the clock starts',
    description:
      'Map your company against NIS2UmsuCG, NISG 2024 and the Swiss ISG. See deadlines and visible gaps in one clear report.',
    url: '/',
    siteName: 'NexusScope',
    locale: 'en_GB',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value)

  return (
    <html lang={locale} className={`dark ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
