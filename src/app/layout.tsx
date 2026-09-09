import type { Metadata } from 'next'
import { Archivo, Archivo_Black, Literata } from 'next/font/google'
import { cookies } from 'next/headers'
import { localeFromCookie } from '@/i18n'
import './globals.css'

const display = Archivo_Black({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-face',
  weight: '400',
})

const sans = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
  weight: ['400', '500', '600', '700'],
})

const reading = Literata({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-reading-face',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'NexusScope – Cyber-reporting & compliance orientation for the DACH region',
  description:
    'Which cyber-incident reporting duties apply to your company? NexusScope maps your profile against the German, Austrian and Swiss regimes (NIS2UmsuCG, NISG 2024, ISG) – with reporting deadlines and a prioritised gap list.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value)

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable} ${reading.variable}`}>
      <body
        className="min-h-screen antialiased"
        style={{
          fontFamily: 'var(--font-sans-face), var(--font-sans)',
          ['--font-display' as string]: 'var(--font-display-face), "Arial Black", sans-serif',
          ['--font-sans' as string]: 'var(--font-sans-face), "Helvetica Neue", Arial, sans-serif',
          ['--font-reading' as string]: 'var(--font-reading-face), Georgia, serif',
        }}
      >
        {children}
      </body>
    </html>
  )
}
