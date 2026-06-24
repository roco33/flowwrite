import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text'
import { $createListItemNode, $createListNode } from '@lexical/list'
import {
  $createTextNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'

interface TransformResult {
  node: LexicalNode
}

function transformParagraph(text: string): TransformResult | null {
  let m: RegExpExecArray | null

  if ((m = /^(#{1,6})\s+(.+)$/.exec(text))) {
    const tag = `h${m[1].length}` as HeadingTagType
    const heading = $createHeadingNode(tag)
    heading.append($createTextNode(m[2]))
    return { node: heading }
  }

  if ((m = /^>\s*(.*)$/.exec(text))) {
    const quote = $createQuoteNode()
    if (m[1]) quote.append($createTextNode(m[1]))
    return { node: quote }
  }

  if ((m = /^[-*+]\s+(.+)$/.exec(text))) {
    const ul = $createListNode('bullet')
    const li = $createListItemNode()
    li.append($createTextNode(m[1]))
    ul.append(li)
    return { node: ul }
  }

  if ((m = /^(\d+)\.\s+(.+)$/.exec(text))) {
    const ol = $createListNode('number')
    const li = $createListItemNode()
    li.append($createTextNode(m[1]))
    ol.append(li)
    return { node: ol }
  }

  return null
}

export function attachAutoFormatEnter(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    KEY_ENTER_COMMAND,
    (): boolean => {
      const selection = $getSelection()
      if (
        selection === null ||
        !$isRangeSelection(selection) ||
        !selection.isCollapsed()
      ) {
        return false
      }

      const anchor = selection.anchor
      const node = anchor.getNode()

      if (!$isParagraphNode(node)) return false

      const text = node.getTextContent()
      if (anchor.offset !== text.length) return false

      const result = transformParagraph(text)
      if (!result) return false

      node.replace(result.node)
      result.node.selectEnd()

      return false
    },
    COMMAND_PRIORITY_LOW,
  )
}
