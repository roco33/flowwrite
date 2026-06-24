<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import {
    createEditor,
    $getRoot as getRoot,
    $getSelection as getSelection,
    KEY_ENTER_COMMAND,
    KEY_BACKSPACE_COMMAND,
    type LexicalEditor as TLexicalEditor,
  } from 'lexical'
  import {
    $convertToMarkdownString as serializeMarkdown,
    $convertFromMarkdownString as parseMarkdown,
  } from '@lexical/markdown'
  import { nodes } from './nodes'
  import { theme } from './theme'
  import { registerRichText } from '@lexical/rich-text'
  import {
    attachHistory,
    attachMarkdownShortcuts,
    attachAutoFormatEnter,
    attachBackspaceConsume,
    attachClearFormat,
    attachTablePlugin,
  } from './plugins'
  import { FLOW_TRANSFORMERS } from './plugins/markdownShortcut'

  let {
    onReady = () => {},
    onChange = () => {},
  }: {
    onReady?: (editor: TLexicalEditor) => void
    onChange?: (payload: { markdown: string; plainText: string; charCount: number; wordCount: number }) => void
  } = $props()

  let editor: TLexicalEditor | null = null
  const cleanups: Array<() => void> = []
  let container: HTMLDivElement

  onMount(() => {
    editor = createEditor({
      namespace: 'flowwrite',
      nodes,
      theme,
      onError: (err) => console.error('[flowwrite]', err),
    })
    editor.setRootElement(container)
    cleanups.push(registerRichText(editor))
    cleanups.push(attachHistory(editor))
    cleanups.push(attachMarkdownShortcuts(editor))
    cleanups.push(attachAutoFormatEnter(editor))
    cleanups.push(attachBackspaceConsume(editor))
    cleanups.push(attachTablePlugin(editor))
    cleanups.push(attachClearFormat(editor))
    const w = window as unknown as {
      __flowEditor?: TLexicalEditor
      __flow?: {
        typeText: (text: string) => void
        enter: () => void
        backspace: () => void
        loadMarkdown: (md: string) => void
        getMarkdown: () => string
      }
    }
    w.__flowEditor = editor
    w.__flow = {
      typeText: async (text: string) => {
        for (const ch of text) {
          await new Promise<void>((resolve) => {
            editor!.update(() => {
              const selection = getSelection()
              selection?.insertText(ch)
            })
            setTimeout(resolve, 0)
          })
        }
      },
      enter: () => {
        editor!.dispatchCommand(KEY_ENTER_COMMAND, null)
      },
      backspace: () => {
        editor!.dispatchCommand(KEY_BACKSPACE_COMMAND, {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as KeyboardEvent)
      },
      loadMarkdown: (md: string) => {
        editor!.update(
          () => {
            const root = getRoot()
            root.clear()
            parseMarkdown(md, FLOW_TRANSFORMERS)
          },
          { tag: 'historic' },
        )
      },
      getMarkdown: () => {
        let result = ''
        editor!.read(() => {
          result = serializeMarkdown(FLOW_TRANSFORMERS)
        })
        return result
      },
    }
    cleanups.push(
      editor.registerUpdateListener(({ editorState, prevEditorState }) => {
        if (prevEditorState === editorState) return
        editorState.read(() => {
          const root = getRoot()
          const plainText = root.getTextContent()
          const markdown = serializeMarkdown(FLOW_TRANSFORMERS)
          const charCount = plainText.length
          const wordCount = countWords(plainText)
          onChange({ markdown, plainText, charCount, wordCount })
        })
      }),
    )
    onReady(editor)
  })

  onDestroy(() => {
    while (cleanups.length) cleanups.pop()?.()
    if (editor) {
      editor.setRootElement(null)
      editor = null
    }
  })

  function countWords(text: string): number {
    const chinese = (text.match(/[一-龥]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    return chinese + english
  }
</script>

<div
  class="flow-editor-shell"
  bind:this={container}
  contenteditable="true"
  spellcheck="false"
></div>

<style>
  .flow-editor-shell {
    min-height: 60vh;
    padding: 1rem 1.25rem;
    outline: none;
    line-height: 1.7;
    color: var(--flow-fg, #1a1a1a);
  }
  .flow-editor-shell:empty::before {
    content: '开始书写...';
    color: var(--flow-fg-muted, #aaa);
    pointer-events: none;
  }

  .flow-editor-shell :global(.flow-h1) {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 1rem 0 0.5rem;
    line-height: 1.3;
  }
  .flow-editor-shell :global(.flow-h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem;
    line-height: 1.35;
  }
  .flow-editor-shell :global(.flow-h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.75rem 0 0.5rem;
  }
  .flow-editor-shell :global(.flow-h4),
  .flow-editor-shell :global(.flow-h5),
  .flow-editor-shell :global(.flow-h6) {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0.625rem 0 0.5rem;
  }
  .flow-editor-shell :global(.flow-quote) {
    border-left: 3px solid var(--flow-border, #ddd);
    padding: 0.25rem 0 0.25rem 1rem;
    color: var(--flow-fg-muted, #555);
    margin: 0.5rem 0;
  }
  .flow-editor-shell :global(.flow-code) {
    font-family: ui-monospace, 'SF Mono', Consolas, monospace;
    background: var(--flow-code-bg, #f6f6f6);
    color: var(--flow-code-fg, inherit);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    display: block;
    white-space: pre;
    font-size: 0.875rem;
    margin: 0.5rem 0;
  }
  .flow-editor-shell :global(.flow-code-inline) {
    font-family: ui-monospace, monospace;
    background: var(--flow-code-bg, #f0f0f0);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    font-size: 0.9em;
  }
  .flow-editor-shell :global(.flow-link) {
    color: var(--flow-accent, #2563eb);
    text-decoration: underline;
    cursor: pointer;
  }
  .flow-editor-shell :global(.flow-bold) {
    font-weight: 700;
  }
  .flow-editor-shell :global(.flow-italic) {
    font-style: italic;
  }
  .flow-editor-shell :global(.flow-ul),
  .flow-editor-shell :global(.flow-ol) {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .flow-editor-shell :global(.flow-table) {
    border-collapse: collapse;
    margin: 0.5rem 0;
  }
  .flow-editor-shell :global(.flow-td) {
    border: 1px solid var(--flow-border, #ddd);
    padding: 0.35rem 0.6rem;
    min-width: 4rem;
  }
  .flow-editor-shell :global(.flow-th) {
    border: 1px solid var(--flow-border, #ddd);
    padding: 0.35rem 0.6rem;
    min-width: 4rem;
    font-weight: 600;
    background: var(--flow-code-bg, #f5f2ec);
  }
  .flow-editor-shell :global(.flow-td .flow-p),
  .flow-editor-shell :global(.flow-th .flow-p) {
    margin: 0;
  }
</style>
