import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { localeFromCookie } from '@/i18n'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'NexusScope – Cyber-reporting & compliance orientation for the DACH region',
  description:
    'Which cyber-incident reporting duties apply to your company? NexusScope maps your profile against the German, Austrian and Swiss regimes (NIS2UmsuCG, NISG 2024, ISG) – with reporting deadlines and a prioritised gap list.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value)

  return (
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen antialiased`}>{children}</body>
    </html>
  )
}
