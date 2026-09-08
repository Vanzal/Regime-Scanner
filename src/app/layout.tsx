import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { cookies } from 'next/headers'
import { localeFromCookie } from '@/i18n'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-face',
  weight: ['500', '600', '700'],
})

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
  weight: ['400', '500', '600', '700'],
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
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body
        className="min-h-screen antialiased"
        style={{
          fontFamily: 'var(--font-sans-face), var(--font-sans)',
          // display face available via CSS var for .font-display
          ['--font-display' as string]: 'var(--font-display-face), Georgia, serif',
          ['--font-sans' as string]: 'var(--font-sans-face), "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  )
}
