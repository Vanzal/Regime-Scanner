import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Regime Radar – Welche Meldepflichten gelten für Ihr Unternehmen?',
  description:
    'Automatisierte Prüfung, welche Cyber-Meldepflichten (DE NIS2UmsuCG, AT NISG, CH ISG) für Ihr Unternehmen gelten – mit Berichtsfristen und Lückenliste.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
