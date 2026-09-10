export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'link'; href: string; children: InlineNode[] }

export type BlockNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'hr' }
  | { type: 'blockquote'; children: BlockNode[] }
  | { type: 'list'; ordered: boolean; items: BlockNode[][] }
  | { type: 'table'; headers: InlineNode[][]; rows: InlineNode[][][] }

export function parseInline(input: string): InlineNode[] {
  const out: InlineNode[] = []
  let i = 0

  const pushText = (value: string) => {
    if (!value) return
    const last = out[out.length - 1]
    if (last?.type === 'text') last.value += value
    else out.push({ type: 'text', value })
  }

  while (i < input.length) {
    if (input.startsWith('**', i)) {
      const end = input.indexOf('**', i + 2)
      if (end !== -1) {
        out.push({ type: 'strong', children: parseInline(input.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }

    if (input[i] === '*' && input[i + 1] !== '*') {
      const end = findClosingAsterisk(input, i + 1)
      if (end !== -1) {
        out.push({ type: 'em', children: parseInline(input.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }

    if (input[i] === '[') {
      const close = input.indexOf(']', i + 1)
      if (close !== -1 && input[close + 1] === '(') {
        const hrefEnd = input.indexOf(')', close + 2)
        if (hrefEnd !== -1) {
          out.push({
            type: 'link',
            href: input.slice(close + 2, hrefEnd),
            children: parseInline(input.slice(i + 1, close)),
          })
          i = hrefEnd + 1
          continue
        }
      }
    }

    pushText(input[i]!)
    i++
  }

  return out
}

function findClosingAsterisk(input: string, from: number): number {
  let j = from
  while (j < input.length) {
    if (input[j] === '*' && input[j - 1] !== '*') {
      if (input[j + 1] === '*') {
        j += 2
        continue
      }
      return j
    }
    j++
  }
  return -1
}

export function parseMarkdown(markdown: string): BlockNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  return parseLines(lines)
}

function parseLines(lines: string[]): BlockNode[] {
  const blocks: BlockNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1]!.length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInline(heading[2]!),
      })
      i++
      continue
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length) {
        const q = lines[i] ?? ''
        const qt = q.trim()
        if (qt.startsWith('>')) {
          quoteLines.push(q.replace(/^\s*>\s?/, ''))
          i++
          continue
        }
        if (!qt && quoteLines.length > 0 && (lines[i + 1] ?? '').trim().startsWith('>')) {
          quoteLines.push('')
          i++
          continue
        }
        break
      }
      blocks.push({ type: 'blockquote', children: parseLines(quoteLines) })
      continue
    }

    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        tableLines.push((lines[i] ?? '').trim())
        i++
      }
      const table = parseTable(tableLines)
      if (table) blocks.push(table)
      continue
    }

    const ordered = /^\d+\.\s+/.test(trimmed)
    const unordered = /^[-*]\s+/.test(trimmed)
    if (ordered || unordered) {
      const items: BlockNode[][] = []
      const itemRe = ordered ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/
      while (i < lines.length) {
        const t = (lines[i] ?? '').trim()
        const match = itemRe.exec(t)
        if (!match) break
        items.push([{ type: 'paragraph', children: parseInline(match[1]!) }])
        i++
      }
      if (items.length) {
        blocks.push({ type: 'list', ordered, items })
        continue
      }
    }

    const para: string[] = []
    while (i < lines.length) {
      const t = (lines[i] ?? '').trim()
      if (!t) break
      if (/^---+$/.test(t)) break
      if (/^#{1,6}\s+/.test(t)) break
      if (t.startsWith('>')) break
      if (t.startsWith('|')) break
      if (/^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) break
      para.push(t)
      i++
    }
    const text = para.join(' ').replace(/\s+/g, ' ').trim()
    if (text) blocks.push({ type: 'paragraph', children: parseInline(text) })
  }

  return blocks
}

function parseTable(lines: string[]): BlockNode | null {
  if (lines.length < 2) return null
  const rows = lines.map(splitTableRow)
  const header = rows[0]
  if (!header) return null
  let bodyStart = 1
  if (rows[1] && rows[1].every((cell) => /^:?-{3,}:?$/.test(cell))) bodyStart = 2
  const body = rows.slice(bodyStart)
  return {
    type: 'table',
    headers: header.map((cell) => parseInline(cell)),
    rows: body.map((row) => {
      const cells = [...row]
      while (cells.length < header.length) cells.push('')
      return cells.slice(0, header.length).map((cell) => parseInline(cell))
    }),
  }
}

function splitTableRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((cell) => cell.trim())
}

export function inlineText(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.value
      if (n.type === 'link') return inlineText(n.children)
      if (n.type === 'strong' || n.type === 'em') return inlineText(n.children)
      return ''
    })
    .join('')
}

export function blocksText(blocks: BlockNode[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'hr') return ''
      if (b.type === 'heading' || b.type === 'paragraph') return inlineText(b.children)
      if (b.type === 'blockquote') return blocksText(b.children)
      if (b.type === 'list') return b.items.map((item) => blocksText(item)).join('\n')
      if (b.type === 'table') {
        const head = b.headers.map(inlineText).join(' | ')
        const rows = b.rows.map((row) => row.map(inlineText).join(' | ')).join('\n')
        return `${head}\n${rows}`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}
