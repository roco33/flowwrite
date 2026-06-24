<script lang="ts">
  import { onMount } from 'svelte'
  import { $convertFromMarkdownString as parseMarkdown } from '@lexical/markdown'
  import { FLOW_TRANSFORMERS } from './editor/plugins/markdownShortcut'
  import { $getRoot as getRoot, type LexicalEditor } from 'lexical'
  import Editor from './editor/Editor.svelte'
  import Toolbar from './components/Toolbar.svelte'
  import Statusbar from './components/Statusbar.svelte'
  import DocSwitcher from './components/DocSwitcher.svelte'
  import {
    loadPrefs,
    savePrefs,
    resolveTheme,
    type Theme,
  } from './storage/prefs'
  import {
    listDocs,
    getDoc,
    saveDoc,
    deleteDoc,
    createNewDoc,
    type Doc,
  } from './storage/docs'
  import { openMdFile, saveMdFile } from './lib/fileIO'
  import { debounce } from './lib/debounce'

  type EditorPayload = {
    markdown: string
    plainText: string
    charCount: number
    wordCount: number
  }

  let editor: LexicalEditor | null = null
  let docs = $state<Doc[]>([])
  let currentDoc = $state<Doc | null>(null)
  let theme = $state<Theme>('auto')
  let showSwitcher = $state(false)
  let charCount = $state(0)
  let wordCount = $state(0)
  let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle')
  let savedAt = $state<number | null>(null)

  const prefs = loadPrefs()
  theme = prefs.theme

  const persist = debounce(async () => {
    if (!currentDoc) return
    saveStatus = 'saving'
    currentDoc.title = deriveTitle(currentDoc.markdown)
    currentDoc.updatedAt = Date.now()
    await saveDoc(currentDoc)
    saveStatus = 'saved'
    savedAt = Date.now()
    refreshDocList()
  }, 800)

  function deriveTitle(md: string): string {
    const m = /^#{1,6}\s+(.+?)\s*$/m.exec(md)
    if (m) return m[1]
    const firstLine = md.split('\n').find((l) => l.trim())
    if (firstLine) return firstLine.slice(0, 40)
    return currentDoc?.title || '未命名'
  }

  async function refreshDocList() {
    docs = await listDocs()
  }

  function loadDocIntoEditor(doc: Doc) {
    if (!editor) return
    editor.update(
      () => {
        const root = getRoot()
        root.clear()
        parseMarkdown(doc.markdown, FLOW_TRANSFORMERS)
      },
      { tag: 'historic' },
    )
  }

  async function switchToDoc(id: string) {
    if (!editor) return
    if (currentDoc) await saveDoc(currentDoc)
    const next = await getDoc(id)
    if (!next) return
    currentDoc = next
    loadDocIntoEditor(next)
    prefs.lastDocId = id
    savePrefs(prefs)
    showSwitcher = false
  }

  async function createDoc() {
    if (!editor) return
    if (currentDoc) await saveDoc(currentDoc)
    const doc = createNewDoc()
    await saveDoc(doc)
    currentDoc = doc
    loadDocIntoEditor(doc)
    await refreshDocList()
    prefs.lastDocId = doc.id
    savePrefs(prefs)
    showSwitcher = false
  }

  async function deleteDocById(id: string) {
    // 若删除的是当前文档，先清空 currentDoc，避免后续 switchToDoc/createDoc
    // 触发 saveDoc(currentDoc) 把已删除的文档重新写回 IndexedDB。
    const isCurrent = currentDoc?.id === id
    await deleteDoc(id)
    if (isCurrent) {
      currentDoc = null
      const remaining = await listDocs()
      if (remaining.length > 0) {
        await switchToDoc(remaining[0].id)
      } else {
        await createDoc()
      }
    }
    await refreshDocList()
  }

  async function handleOpen() {
    const doc = await openMdFile()
    if (!doc) return
    doc.id = createNewDoc().id
    await saveDoc(doc)
    currentDoc = doc
    loadDocIntoEditor(doc)
    await refreshDocList()
    prefs.lastDocId = doc.id
    savePrefs(prefs)
  }

  async function handleSave() {
    if (!currentDoc) return
    await saveMdFile(currentDoc.markdown, `${currentDoc.title}.md`)
  }

  function handleEditorReady(e: LexicalEditor) {
    editor = e
    void (async () => {
      await refreshDocList()
      const lastId = prefs.lastDocId
      const startDoc = lastId ? await getDoc(lastId) : null
      if (startDoc) {
        currentDoc = startDoc
      } else if (docs.length > 0) {
        currentDoc = docs[0]
      } else {
        const fresh = createNewDoc()
        await saveDoc(fresh)
        currentDoc = fresh
        await refreshDocList()
      }
      if (currentDoc) {
        loadDocIntoEditor(currentDoc)
      }
    })()
  }

  function handleEditorChange(p: EditorPayload) {
    charCount = p.charCount
    wordCount = p.wordCount
    if (currentDoc) {
      currentDoc.markdown = p.markdown
      saveStatus = 'saving'
      void persist()
    }
  }

  function handleToggleTheme(t: Theme) {
    theme = t
    prefs.theme = t
    savePrefs(prefs)
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'o':
          e.preventDefault()
          void handleOpen()
          break
        case 's':
          e.preventDefault()
          void handleSave()
          break
        case 'n':
          e.preventDefault()
          void createDoc()
          break
        case 'p':
          e.preventDefault()
          showSwitcher = true
          break
      }
    } else if (e.key === 'F2') {
      e.preventDefault()
      const cycle: Theme[] = ['auto', 'light', 'dark']
      handleToggleTheme(cycle[(cycle.indexOf(theme) + 1) % cycle.length])
    }
  }

  const resolvedTheme = $derived(resolveTheme(theme))

  $effect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  })

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeydown)
    return () => window.removeEventListener('keydown', handleGlobalKeydown)
  })
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="app">
  <Toolbar
    {theme}
    onOpen={handleOpen}
    onSave={handleSave}
    onNew={createDoc}
    onSwitchDoc={() => (showSwitcher = true)}
    onToggleTheme={handleToggleTheme}
  />
  <main class="editor-area">
    <div class="editor-card">
      <Editor onReady={handleEditorReady} onChange={handleEditorChange} />
    </div>
  </main>
  <Statusbar
    {charCount}
    {wordCount}
    {saveStatus}
    {savedAt}
    docTitle={currentDoc?.title ?? ''}
  />
</div>

{#if showSwitcher}
  <DocSwitcher
    {docs}
    currentId={currentDoc?.id ?? null}
    onOpen={(id) => void switchToDoc(id)}
    onDelete={(id) => void deleteDocById(id)}
    onCreate={() => void createDoc()}
    onClose={() => (showSwitcher = false)}
  />
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .editor-area {
    flex: 1;
    overflow: auto;
    padding: 1.5rem 1rem;
  }
  .editor-card {
    max-width: 760px;
    margin: 0 auto;
    background: var(--flow-bg-elevated, var(--flow-bg));
    border: 1px solid var(--flow-border);
    border-radius: 6px;
    min-height: calc(100vh - 200px);
    box-shadow: var(--flow-shadow);
  }
</style>
