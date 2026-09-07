import type { ReactNode } from 'react'

/**
 * Minimaler Inline-Markdown-Renderer für Berichtstexte (`**fett**`).
 * Mehr Syntax brauchen die reasoning-/limits-Texte bewusst nicht.
 */
export function renderInlineMd(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
