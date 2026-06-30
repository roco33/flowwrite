import {
  $createParagraphNode,
  $createTextNode,
  type ElementNode,
  type LexicalNode,
} from 'lexical'
import {
  $convertFromMarkdownString as parseMarkdownInline,
  BOLD_ITALIC_STAR,
  BOLD_STAR,
  HIGHLIGHT,
  INLINE_CODE,
  ITALIC_STAR,
  LINK,
  STRIKETHROUGH,
  type ElementTransformer,
  type MultilineElementTransformer,
  type Transformer,
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

// 仅行内格式 transformer：用于解析单元格内的 **bold**、*italic*、`code`、[link](url) 等。
// 刻意排除段落级 transformer（heading/quote/list/code-block），避免单元格内容被误判为块级结构。
const CELL_INLINE_TRANSFORMERS: Transformer[] = [
  BOLD_ITALIC_STAR,
  BOLD_STAR,
  ITALIC_STAR,
  STRIKETHROUGH,
  HIGHLIGHT,
  INLINE_CODE,
  LINK,
]

/**
 * 把单元格文本解析成带行内格式的节点，append 到给定段落。
 * 单元格内容应是纯行内格式（无块级结构），所以只走行内 transformer。
 * 空字符串保留空 TextNode，保证单元格始终可编辑。
 *
 * $convertFromMarkdownString(text, transformers, node) 会清空 node 并把解析结果
 * append 进去——而 $importBlocks 每行都会自建一个 ParagraphNode 装 TextNode。
 * 单元格文本只有一行，所以 buffer 下只会挂一个段落。这里要把那个段落的叶子
 * 节点（TextNode / LinkNode 等行内节点）搬进 cell 自己的段落，避免
 * TableCell > Paragraph > Paragraph 的非法嵌套。
 */
function appendInlineContent(paragraph: ReturnType<typeof $createParagraphNode>, text: string): void {
  if (text.trim() === '') {
    paragraph.append($createTextNode(text))
    return
  }
  const buffer = $createParagraphNode()
  parseMarkdownInline(text, CELL_INLINE_TRANSFORMERS, buffer)
  const innerParagraphs = buffer.getChildren()
  if (innerParagraphs.length === 0) {
    paragraph.append($createTextNode(text))
    return
  }
  // 把每个内部段落的叶子节点搬到 cell 段落里。
  const leaves: LexicalNode[] = []
  for (const para of innerParagraphs) {
    if ('getChildren' in para && typeof (para as { getChildren: unknown }).getChildren === 'function') {
      leaves.push(...(para as ElementNode).getChildren())
    } else {
      leaves.push(para)
    }
  }
  if (leaves.length === 0) {
    paragraph.append($createTextNode(text))
    return
  }
  paragraph.append(...leaves)
}

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
      appendInlineContent(p, headerCells[c] ?? '')
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
        appendInlineContent(p, cells[c] ?? '')
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
