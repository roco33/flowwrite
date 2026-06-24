import {
  registerMarkdownShortcuts,
  TRANSFORMERS as DEFAULT_TRANSFORMERS,
} from '@lexical/markdown'
import type { LexicalEditor } from 'lexical'
import { TABLE_TRANSFORMERS } from './tableTransformer'

// 自定义 transformer 集合：默认 + 表格（import + export）
export const FLOW_TRANSFORMERS = [...DEFAULT_TRANSFORMERS, ...TABLE_TRANSFORMERS]

type Transformer = (typeof FLOW_TRANSFORMERS)[number]

export function attachMarkdownShortcuts(
  editor: LexicalEditor,
  transformers: Transformer[] = FLOW_TRANSFORMERS,
): () => void {
  return registerMarkdownShortcuts(editor, transformers)
}
