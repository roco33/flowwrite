import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $isCodeNode } from '@lexical/code'
import { $isListItemNode } from '@lexical/list'
import { $isLinkNode } from '@lexical/link'

function isBlockFormatNode(node: LexicalNode): node is ElementNode {
  return (
    $isHeadingNode(node) ||
    $isQuoteNode(node) ||
    $isCodeNode(node) ||
    $isListItemNode(node)
  )
}

function downgradeBlockChildren(block: LexicalNode): void {
  if (!isBlockFormatNode(block)) return
  const p = $createParagraphNode()
  block.getChildren().slice().forEach((c) => p.append(c))
  block.replace(p)
}

function unwrapInline(node: LexicalNode): void {
  if ($isLinkNode(node)) {
    node.replace($createTextNode(node.getTextContent()))
    return
  }
  if ($isTextNode(node)) {
    node.setFormat(0)
  }
}

export function attachClearFormat(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event): boolean => {
      if (!((event.ctrlKey || event.metaKey) && event.key === '\\')) {
        return false
      }
      event.preventDefault()
      editor.update(() => {
        const selection = $getSelection()
        if (!selection || !$isRangeSelection(selection)) return

        const blocks = new Set<LexicalNode>()
        selection.getNodes().forEach((n) => {
          const top = n.getTopLevelElement()
          if (top) blocks.add(top)
        })
        blocks.forEach(downgradeBlockChildren)

        const fresh = $getSelection()
        if (fresh && $isRangeSelection(fresh)) {
          fresh.getNodes().forEach(unwrapInline)
        }
      })
      return true
    },
    COMMAND_PRIORITY_LOW,
  )
}
