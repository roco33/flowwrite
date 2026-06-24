import { get, set, del, keys } from 'idb-keyval'

const PREFIX = 'flowwrite:doc:'

export interface Doc {
  id: string
  title: string
  markdown: string
  createdAt: number
  updatedAt: number
}

export async function listDocs(): Promise<Doc[]> {
  const allKeys = (await keys<string>()) as string[]
  const docKeys = allKeys.filter((k) => k.startsWith(PREFIX))
  const docs = await Promise.all(docKeys.map((k) => get<Doc>(k)))
  return docs
    .filter((d): d is Doc => Boolean(d))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getDoc(id: string): Promise<Doc | undefined> {
  return get<Doc>(PREFIX + id)
}

export async function saveDoc(doc: Doc): Promise<void> {
  // currentDoc 可能是 Svelte 5 $state Proxy，IndexedDB structured clone 不支持。
  // 解构成 plain object。
  const plain: Doc = {
    id: doc.id,
    title: doc.title,
    markdown: doc.markdown,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
  await set(PREFIX + doc.id, plain)
}

export async function deleteDoc(id: string): Promise<void> {
  await del(PREFIX + id)
}

export function newDocId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  )
}

export function createNewDoc(title = '新文档', markdown = ''): Doc {
  const now = Date.now()
  return {
    id: newDocId(),
    title,
    markdown,
    createdAt: now,
    updatedAt: now,
  }
}

export function deriveTitle(markdown: string): string {
  const m = /^#{1,6}\s+(.+?)\s*$/m.exec(markdown)
  if (m) return m[1]
  const firstLine = markdown.split('\n').find((l) => l.trim())
  if (firstLine) return firstLine.slice(0, 40)
  return '未命名'
}
