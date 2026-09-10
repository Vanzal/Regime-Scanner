import Link from 'next/link'
import type { ReactNode } from 'react'
import { parseMarkdown, type BlockNode, type InlineNode } from './parse'

export function LegalMarkdown({ markdown }: { markdown: string }) {
  return <LegalBlocks blocks={parseMarkdown(markdown)} />
}

function LegalBlocks({ blocks }: { blocks: BlockNode[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <LegalBlock key={i} block={block} />
      ))}
    </>
  )
}

function LegalBlock({ block }: { block: BlockNode }) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag>
          <Inline nodes={block.children} />
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <p>
          <Inline nodes={block.children} />
        </p>
      )
    case 'hr':
      return <hr />
    case 'blockquote':
      return (
        <blockquote>
          <LegalBlocks blocks={block.children} />
        </blockquote>
      )
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}>
              <LegalBlocks blocks={item} />
            </li>
          ))}
        </Tag>
      )
    }
    case 'table':
      return (
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                {block.headers.map((cell, i) => (
                  <th key={i} scope="col">
                    <Inline nodes={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      <Inline nodes={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => (
        <InlineNodeView key={i} node={node} />
      ))}
    </>
  )
}

function InlineNodeView({ node }: { node: InlineNode }): ReactNode {
  switch (node.type) {
    case 'text':
      return node.value
    case 'strong':
      return (
        <strong>
          <Inline nodes={node.children} />
        </strong>
      )
    case 'em':
      return (
        <em>
          <Inline nodes={node.children} />
        </em>
      )
    case 'link':
      return <MdLink href={node.href} childrenNodes={node.children} />
  }
}

function MdLink({ href, childrenNodes }: { href: string; childrenNodes: InlineNode[] }) {
  const label = <Inline nodes={childrenNodes} />
  if (href.startsWith('/') && !href.startsWith('//')) {
    return <Link href={href}>{label}</Link>
  }
  if (href.startsWith('mailto:')) {
    return <a href={href}>{label}</a>
  }
  return (
    <a href={href} rel="noopener noreferrer">
      {label}
    </a>
  )
}
