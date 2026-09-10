import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getDict, localeFromCookie, type Locale } from '@/i18n'
import { SiteFooter } from '@/components/site/site-footer'
import {
  LEGAL_DOCUMENT_ORDER,
  LEGAL_DOCUMENTS,
  type LegalDocId,
} from '@/lib/legal/catalog'
import { loadLegalMarkdown } from '@/lib/legal/load'
import { LegalMarkdown } from '@/lib/legal/render'

export function legalMetadata(id: LegalDocId): Metadata {
  const doc = LEGAL_DOCUMENTS[id]
  return {
    title: `${doc.title.en} – NexusScope`,
    description: doc.description.en,
    alternates: {
      canonical: doc.href,
    },
  }
}

export async function LegalDocumentPage({ id }: { id: LegalDocId }) {
  const cookieStore = await cookies()
  const locale = localeFromCookie(cookieStore.get('lang')?.value) as Locale
  const dict = getDict(locale)
  const markdown = loadLegalMarkdown(id)

  return (
    <div className="min-h-screen bg-[var(--ns-bg)] text-[var(--ns-fg)]">
      <header className="border-b-2 border-[var(--ns-fg)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-sm tracking-tight sm:text-base">
            NexusScope
          </Link>
          <nav aria-label={dict.site.legal.docs_nav} className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs sm:text-sm">
            {LEGAL_DOCUMENT_ORDER.map((otherId) => {
              const other = LEGAL_DOCUMENTS[otherId]
              const label = other.short[locale]
              if (otherId === id) {
                return (
                  <span key={otherId} aria-current="page" className="font-semibold text-[var(--ns-fg)]">
                    {label}
                  </span>
                )
              }
              return (
                <Link
                  key={otherId}
                  href={other.href}
                  className="text-[var(--ns-fg-muted)] underline-offset-4 transition hover:text-[var(--ns-fg)] hover:underline"
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="font-instrument text-[11px] uppercase tracking-[0.16em] text-[var(--ns-fg-dim)]">
          {dict.site.legal.language_note}
        </p>
        <article className="legal-doc mt-6" data-testid={`legal-doc-${id}`}>
          <LegalMarkdown markdown={markdown} />
        </article>
      </main>

      <SiteFooter dict={dict} locale={locale} />
    </div>
  )
}
