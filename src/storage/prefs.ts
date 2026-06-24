const KEY = 'flowwrite:prefs'

export type Theme = 'light' | 'dark' | 'auto'

export interface Prefs {
  theme: Theme
  lastDocId: string | null
}

const DEFAULT: Prefs = {
  theme: 'auto',
  lastDocId: null,
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return { ...DEFAULT, ...parsed }
  } catch {
    return { ...DEFAULT }
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch (err) {
    console.error('[flowwrite] savePrefs failed', err)
  }
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'auto') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
