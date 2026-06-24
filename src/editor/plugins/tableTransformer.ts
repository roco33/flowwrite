import {
  $createParagraphNode,
  $createTextNode,
  type ElementNode,
  type LexicalNode,
} from 'lexical'
import type {
  ElementTransformer,
  MultilineElementTransformer,
} from '@lexical/markdown'
import {
  $createTableNode,
  $createTableCellNode,
  $createTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'

// 表头行：| a | b |
const HEADER_LINE = /^\|(.+)\|\s*$/
// 分隔行：| --- | --- |（允许 : 对齐标记）
const SEPARATOR_LINE = /^\|?[\s:|-]+\|?\s*$/
// 数据行：| x | y |
const DATA_LINE = /^\|(.+)\|\s*$/

function parseRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

// 判断一行是否是表格数据行（表头或数据）
function isTableLine(line: string): boolean {
  return DATA_LINE.test(line) || SEPARATOR_LINE.test(line)
}

/**
 * MultilineElementTransformer：负责 import（markdown → TableNode）。
 * 表格从表头行开始，分隔行紧跟，之后连续的数据行构成主体。
 * 遇到非表格行即结束。
 */
const TABLE_IMPORTER: MultilineElementTransformer = {
  type: 'multiline-element',
  dependencies: [TableNode, TableRowNode, TableCellNode],
  regExpStart: HEADER_LINE,
  regExpEnd: undefined,

  handleImportAfterStartMatch({
    lines,
    rootNode,
    startLineIndex,
    startMatch,
  }): [boolean, number] | null {
    // 当前行是表头（startMatch 已匹配 HEADER_LINE）
    // 检查下一行是否是分隔行
    const nextLine = lines[startLineIndex + 1]
    if (!nextLine || !SEPARATOR_LINE.test(nextLine)) {
      return null // 不是表格，交给其他 transformer
    }

    // 收集所有连续的表格行（表头 + 分隔 + 数据行）
    const tableLines: string[] = [lines[startLineIndex]]
    let endLineIndex = startLineIndex + 1
    while (endLineIndex + 1 < lines.length && isTableLine(lines[endLineIndex + 1])) {
      endLineIndex++
      tableLines.push(lines[endLineIndex])
    }
    // 至少要有表头 + 分隔行
    if (tableLines.length < 2) return null

    // 解析并构建 TableNode
    const headerCells = parseRow(startMatch[1])
    const colCount = headerCells.length

    const table = $createTableNode()

    // 表头行
    const headerRow = $createTableRowNode()
    for (let c = 0; c < colCount; c++) {
      const cell = $createTableCellNode(TableCellHeaderStates.COLUMN)
      const p = $createParagraphNode()
      p.append($createTextNode(headerCells[c] ?? ''))
      cell.append(p)
      headerRow.append(cell)
    }
    table.append(headerRow)

    // 数据行（跳过 tableLines[0] 表头；分隔行没进数组）
    for (let i = 1; i < tableLines.length; i++) {
      const cells = parseRow(tableLines[i])
      const row = $createTableRowNode()
      for (let c = 0; c < colCount; c++) {
        const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS)
        const p = $createParagraphNode()
        p.append($createTextNode(cells[c] ?? ''))
        cell.append(p)
        row.append(cell)
      }
      table.append(row)
    }

    rootNode.append(table)
    return [true, endLineIndex]
  },

  // MultilineElementTransformer 的 replace 不在 import 路径上调用（import 走 handleImportAfterStartMatch），
  // 但类型要求必须有。提供一个 no-op。
  replace(): boolean {
    return false
  },
}

/**
 * ElementTransformer 的 export：TableNode → markdown 表格语法。
 * 与 import 路径分离，因为 export 是逐节点遍历的，不需要多行匹配。
 */
const TABLE_EXPORTER: ElementTransformer = {
  type: 'element',
  dependencies: [TableNode, TableRowNode, TableCellNode],
  regExp: HEADER_LINE, // export 不用 regExp，但类型要求有

  replace(): void {
    // export-only transformer，import 走 MultilineElementTransformer
  },

  export(
    node: LexicalNode,
    traverseChildren: (node: ElementNode) => string,
  ): string | null {
    if (!(node instanceof TableNode)) return null

    const rows = node.getChildren() as TableRowNode[]
    if (rows.length === 0) return null

    const matrix: string[][] = []
    for (const row of rows) {
      const cells = row.getChildren() as TableCellNode[]
      matrix.push(
        cells.map((cell) => {
          const inner = traverseChildren(cell).trim()
          return inner.replace(/\n/g, ' ') || ' '
        }),
      )
    }

    const colCount = matrix[0].length
    const lines: string[] = []

    // 表头行
    lines.push('| ' + matrix[0].join(' | ') + ' |')
    // 分隔行
    lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |')
    // 数据行
    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r]
      while (row.length < colCount) row.push(' ')
      lines.push('| ' + row.join(' | ') + ' |')
    }

    return lines.join('\n') + '\n'
  },
}

// 导出两个 transformer，都要加入 FLOW_TRANSFORMERS
export const TABLE_TRANSFORMERS: Array<ElementTransformer | MultilineElementTransformer> = [
  TABLE_IMPORTER,
  TABLE_EXPORTER,
]
