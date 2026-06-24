import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_BACKSPACE_COMMAND,
  type ElementNode,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical'
import {
  $isHeadingNode,
  $isQuoteNode,
  type HeadingNode,
  type QuoteNode,
} from '@lexical/rich-text'
import { $isListItemNode, type ListItemNode } from '@lexical/list'
import { $isCodeNode, type CodeNode } from '@lexical/code'
import { $isTableNode } from '@lexical/table'

type BlockNode = HeadingNode | QuoteNode | CodeNode | ListItemNode

const INLINE_FORMATS: TextFormatType[] = [
  'bold',
  'italic',
  'code',
  'underline',
  'strikethrough',
]

function downgradeBlock(node: BlockNode): boolean {
  if (node.getTextContent().length > 0) return false
  const p = $createParagraphNode()
  node.replace(p)
  p.select()
  return true
}

export function attachBackspaceConsume(
  editor: LexicalEditor,
): () => void {
  // 标记最近一次 Backspace，供 update listener 用：
  // Backspace 后若光标停在 inline 格式化节点末尾，清除 selection.format
  // 对应位，避免新字符继承 italic/bold 等（Lexical 的格式延续设计）。
  let recentBackspace = false

  const unregisterCommand = editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    (event): boolean => {
      const selection = $getSelection()
      if (
        !selection ||
        !$isRangeSelection(selection) ||
        !selection.isCollapsed()
      ) {
        return false
      }

      const node = selection.anchor.getNode()

      if ($isTextNode(node) && node.getTextContent().length === 0) {
        const hasFormat = INLINE_FORMATS.some((f) => node.hasFormat(f))
        if (hasFormat) {
          node.setFormat(0)
          event?.preventDefault()
          return true
        }
      }

      // 向上找最近的块节点（H1/Quote/Code/ListItem）。
      // 当 HeadingNode 里只剩一个空 TextNode 时，anchor 指向 TextNode，
      // 需要往上走才能命中格式节点。
      let cursor: typeof node | null = node
      let blockNode: BlockNode | null = null
      while (cursor !== null) {
        if (
          $isHeadingNode(cursor) ||
          $isQuoteNode(cursor) ||
          $isCodeNode(cursor) ||
          $isListItemNode(cursor)
        ) {
          blockNode = cursor as BlockNode
          break
        }
        cursor = cursor.getParent()
      }

      if (blockNode && downgradeBlock(blockNode)) {
        event?.preventDefault()
        return true
      }

      // 向上找 TableNode：当光标在空表格单元格内按 Backspace，
      // 若整个表格所有单元格都为空，则删除整个表格，替换为空段落。
      let cursor2: typeof node | null = node
      while (cursor2 !== null) {
        if ($isTableNode(cursor2)) {
          const allEmpty = cursor2.getChildren().every((row) => {
            const rowEl = row as ElementNode
            return rowEl.getChildren().every((cell) => {
              const cellEl = cell as ElementNode
              return cellEl.getTextContent().trim() === ''
            })
          })
          if (allEmpty) {
            const p = $createParagraphNode()
            cursor2.insertBefore(p)
            cursor2.remove()
            p.select()
            event?.preventDefault()
            return true
          }
          break
        }
        cursor2 = cursor2.getParent()
      }

      recentBackspace = true
      return false
    },
    COMMAND_PRIORITY_CRITICAL,
  )

  const unregisterUpdate = editor.registerUpdateListener(
    ({ editorState }) => {
      if (!recentBackspace) return
      recentBackspace = false

      editorState.read(() => {
        const selection = $getSelection()
        if (
          !$isRangeSelection(selection) ||
          !selection.isCollapsed()
        ) {
          return
        }
        const node = selection.anchor.getNode()
        if (!$isTextNode(node)) return
        if (selection.anchor.offset !== node.getTextContentSize()) return

        const toClear = INLINE_FORMATS.filter(
          (f) => node.hasFormat(f) && selection.hasFormat(f),
        )
        if (toClear.length === 0) return

        editor.update(() => {
          const sel = $getSelection()
          if (!$isRangeSelection(sel)) return
          for (const f of toClear) {
            sel.toggleFormat(f)
          }
        })
      })
    },
  )

  return () => {
    unregisterCommand()
    unregisterUpdate()
  }
}
