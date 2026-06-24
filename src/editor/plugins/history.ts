import {
  registerHistory,
  createEmptyHistoryState,
} from '@lexical/history'
import type { LexicalEditor } from 'lexical'

export function attachHistory(editor: LexicalEditor, delay = 300): () => void {
  return registerHistory(editor, createEmptyHistoryState(), delay)
}
