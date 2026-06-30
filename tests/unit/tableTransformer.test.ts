import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEditor,
  $getRoot,
  type LexicalEditor,
} from 'lexical'
import { registerRichText } from '@lexical/rich-text'
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { CodeNode } from '@lexical/code'
import { ListItemNode, ListNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  $convertFromMarkdownString as parseMarkdown,
  $convertToMarkdownString as serializeMarkdown,
  BOLD_STAR,
  ITALIC_STAR,
  INLINE_CODE,
  LINK,
} from '@lexical/markdown'
import { TABLE_TRANSFORMERS } from '../../src/editor/plugins/tableTransformer'

// 只用表格 importer + 行内格式 transformer 做 round-trip 测试
const TRANSFORMERS = [
  ...TABLE_TRANSFORMERS,
  BOLD_STAR,
  ITALIC_STAR,
  INLINE_CODE,
  LINK,
]

/**
 * 这些测试验证 tableTransformer 的关键修复：单元格内的行内 markdown
 * （**bold**、`code`、[link](url)）必须被解析成带格式的节点，而不是
 * 把 `**` 等标记作为字面量塞进单个 TextNode。
 *
 * 修复前：appendInlineContent 用 $createTextNode(text) 硬塞字面量。
 * 修复后：用 $convertFromMarkdownString 走行内 transformer 解析。
 */
describe('tableTransformer — 单元格行内格式', () => {
  let editor: LexicalEditor

  beforeEach(() => {
    editor = createEditor({
      nodes: [
        TableNode,
        TableRowNode,
        TableCellNode,
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        LinkNode,
        AutoLinkNode,
      ],
      onError: (e) => {
        throw e
      },
    })
    registerRichText(editor)
  })

  it('解析单元格内的 **bold** 为带 bold 格式的 TextNode', () => {
    const md = '| 名称 | 状态 |\n| --- | --- |\n| 测试 | **加粗** |'

    editor.update(
      () => {
        $getRoot().clear()
        parseMarkdown(md, TRANSFORMERS)
      },
      { discrete: true },
    )

    let hasBold = false
    editor.getEditorState().read(() => {
      $getRoot()
        .getAllTextNodes()
        .forEach((n) => {
          if (n.getTextContent() === '加粗' && n.hasFormat('bold')) {
            hasBold = true
          }
        })
    })

    expect(hasBold).toBe(true)
  })

  it('不残留字面量 ** 标记', () => {
    const md = '| a |\n| --- |\n| **x** |'

    editor.update(
      () => {
        $getRoot().clear()
        parseMarkdown(md, TRANSFORMERS)
      },
      { discrete: true },
    )

    let text = ''
    editor.getEditorState().read(() => {
      text = $getRoot().getTextContent()
    })

    expect(text).not.toContain('**')
    expect(text).toContain('x')
  })

  it('解析行内代码 `code`', () => {
    const md = '| a |\n| --- |\n| `foo` |'

    editor.update(
      () => {
        $getRoot().clear()
        parseMarkdown(md, TRANSFORMERS)
      },
      { discrete: true },
    )

    let hasCode = false
    editor.getEditorState().read(() => {
      $getRoot()
        .getAllTextNodes()
        .forEach((n) => {
          if (n.getTextContent() === 'foo' && n.hasFormat('code')) {
            hasCode = true
          }
        })
    })

    expect(hasCode).toBe(true)
  })

  it('解析链接 [text](url) 为 LinkNode', () => {
    const md = '| a |\n| --- |\n| [官网](https://x.com) |'

    editor.update(
      () => {
        $getRoot().clear()
        parseMarkdown(md, TRANSFORMERS)
      },
      { discrete: true },
    )

    let linkCount = 0
    editor.getEditorState().read(() => {
      $getRoot()
        .getAllTextNodes()
        .forEach((n) => {
          const parent = n.getParent()
          if (
            parent !== null &&
            parent.getType() === 'link' &&
            n.getTextContent() === '官网'
          ) {
            linkCount++
          }
        })
    })

    expect(linkCount).toBe(1)
  })

  it('round-trip：序列化后保留 **bold**', () => {
    const md = '| a |\n| --- |\n| **x** |'

    editor.update(
      () => {
        $getRoot().clear()
        parseMarkdown(md, TRANSFORMERS)
      },
      { discrete: true },
    )

    let out = ''
    editor.getEditorState().read(() => {
      out = serializeMarkdown(TRANSFORMERS)
    })

    expect(out).toContain('**x**')
  })

  it('空单元格仍可正常导入', () => {
    const md = '| a | b |\n| --- | --- |\n|  |  |'

    editor.update(
      () => {
        $getRoot().clear()
        parseMarkdown(md, TRANSFORMERS)
      },
      { discrete: true },
    )

    let hasTable = false
    editor.getEditorState().read(() => {
      const root = $getRoot()
      hasTable = root.getChildren().some((n) => n.getType() === 'table')
    })

    expect(hasTable).toBe(true)
  })
})
