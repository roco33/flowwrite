import type { Doc } from '../storage/docs'
import { deriveTitle } from '../storage/docs'

interface FilePickerHandle {
  getFile(): Promise<File>
  createWritable(): Promise<{
    write: (data: string) => Promise<void>
    close: () => Promise<void>
  }>
}

declare global {
  interface Window {
    showOpenFilePicker?: (opts: {
      types?: Array<{ description?: string; accept: Record<string, string[]> }>
      multiple?: boolean
    }) => Promise<FilePickerHandle[]>
    showSaveFilePicker?: (opts: {
      suggestedName?: string
      types?: Array<{ description?: string; accept: Record<string, string[]> }>
    }) => Promise<FilePickerHandle>
  }
}

export async function openMdFile(): Promise<Doc | null> {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Markdown',
            accept: { 'text/markdown': ['.md', '.markdown', '.txt'] },
          },
        ],
        multiple: false,
      })
      return await readHandle(handle)
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return null
      console.error('[flowwrite] openMdFile (FSA) failed', err)
    }
  }
  return fallbackOpen()
}

async function readHandle(handle: FilePickerHandle): Promise<Doc> {
  const file = await handle.getFile()
  const markdown = await file.text()
  const now = Date.now()
  return {
    id: '',
    title: deriveTitle(markdown) || file.name.replace(/\.(md|markdown|txt)$/i, ''),
    markdown,
    createdAt: file.lastModified || now,
    updatedAt: now,
  }
}

function fallbackOpen(): Promise<Doc | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt,text/markdown'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const markdown = await file.text()
      const now = Date.now()
      resolve({
        id: '',
        title:
          deriveTitle(markdown) ||
          file.name.replace(/\.(md|markdown|txt)$/i, ''),
        markdown,
        createdAt: file.lastModified || now,
        updatedAt: now,
      })
    }
    input.click()
  })
}

export async function saveMdFile(
  markdown: string,
  suggestedName = 'untitled.md',
): Promise<void> {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Markdown',
            accept: { 'text/markdown': ['.md'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(markdown)
      await writable.close()
      return
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
      console.error('[flowwrite] saveMdFile (FSA) failed', err)
    }
  }
  fallbackSave(markdown, suggestedName)
}

function fallbackSave(markdown: string, name: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name.endsWith('.md') ? name : name + '.md'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
