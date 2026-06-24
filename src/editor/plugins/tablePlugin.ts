import {
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  type LexicalEditor,
} from 'lexical'
import {
  $createTableNodeWithDimensions,
  $isTableNode,
  applyTableHandlers,
  getTableObserverFromTableElement,
  INSERT_TABLE_COMMAND,
  TableNode,
} from '@lexical/table'

/**
 * 表格插件：
 *  1. 注册 INSERT_TABLE_COMMAND（用 $createTableNodeWithDimensions 建表，插到 root 末尾）
 *  2. 监听 TableNode 创建/更新，给它挂 applyTableHandlers，让单元格可点击聚焦
 *
 * hasTabHandler 传 false —— 基础范围不包含 Tab 跳转。
 */
export function attachTablePlugin(editor: LexicalEditor): () => void {
  const cleanups: Array<() => void> = []

  cleanups.push(
    editor.registerCommand(
      INSERT_TABLE_COMMAND,
      ({ rows, columns, includeHeaders }) => {
        const table = $createTableNodeWithDimensions(
          Number(rows),
          Number(columns),
          includeHeaders ?? true,
        )
        $getRoot().append(table)
        return true
      },
      COMMAND_PRIORITY_LOW,
    ),
  )

  cleanups.push(
    editor.registerMutationListener(TableNode, (mutations) => {
      for (const [key, mutation] of mutations) {
        if (mutation !== 'created' && mutation !== 'updated') continue
        const el = editor.getElementByKey(key)
        if (!el) continue
        // 已挂过 observer 就跳过，避免重复绑定
        if (getTableObserverFromTableElement(el as never)) continue
        editor.read(() => {
          const node = $getNodeByKey(key)
          if ($isTableNode(node)) {
            applyTableHandlers(node, el as HTMLElement, editor, false)
          }
        })
      }
    }),
  )

  return () => {
    while (cleanups.length) cleanups.pop()?.()
  }
}
