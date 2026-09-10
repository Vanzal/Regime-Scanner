import fs from 'node:fs'
import path from 'node:path'
import { LEGAL_DOCUMENTS, type LegalDocId } from './catalog'

export function resolveLegalDir(): string {
  const candidates = [
    path.join(process.cwd(), 'content/legal'),
    path.join(process.cwd(), '..', 'content/legal'),
    path.join(process.cwd(), '..', '..', 'content/legal'),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir
  }
  throw new Error(
    `content/legal not found (cwd=${process.cwd()}; tried ${candidates.join(', ')})`,
  )
}

/**
 * Operator-only annexes and the "delete before publishing" callout stay in the
 * source markdown (so the checklist remains in git) and are stripped here
 * before a page is rendered.
 */
export function stripOperatorNotes(markdown: string): string {
  let md = markdown.replace(/\r\n/g, '\n')
  md = md.replace(/\n#{1,2}\s+Annex [CDV]\s+[—–-]\s+Operator checklist[\s\S]*$/i, '\n')
  md = md.replace(/^>\s*\*\*Note for the operator[\s\S]*?(?=\n---\s*$|\n## |\n# )/m, '')
  return md.replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

/** In-document links to nexusscopes.com become site-relative so they work locally. */
export function rewriteSiteUrls(markdown: string): string {
  let md = markdown.replace(/https:\/\/(?:www\.)?nexusscopes\.com(\/[^\s)"'\]]+)/g, '$1')
  // `[ /privacy ]` placeholders (not already markdown links) become clickable.
  md = md.replace(/\[(\/[-a-z0-9/]+)\](?!\()/gi, '[$1]($1)')
  return md
}

export function loadLegalMarkdown(id: LegalDocId): string {
  const doc = LEGAL_DOCUMENTS[id]
  const file = path.join(resolveLegalDir(), doc.file)
  const raw = fs.readFileSync(file, 'utf8')
  return rewriteSiteUrls(stripOperatorNotes(raw))
}
