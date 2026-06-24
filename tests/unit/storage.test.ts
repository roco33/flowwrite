import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPrefs,
  savePrefs,
  resolveTheme,
  type Prefs,
} from '../../src/storage/prefs'
import { deriveTitle } from '../../src/storage/docs'

describe('prefs', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads defaults when empty', () => {
    const prefs = loadPrefs()
    expect(prefs.theme).toBe('auto')
    expect(prefs.focusMode).toBe(false)
    expect(prefs.lastDocId).toBeNull()
  })

  it('round-trips through localStorage', () => {
    const prefs: Prefs = {
      theme: 'dark',
      focusMode: true,
      lastDocId: 'abc',
    }
    savePrefs(prefs)
    expect(loadPrefs()).toEqual(prefs)
  })

  it('returns defaults on corrupt JSON', () => {
    localStorage.setItem('flowwrite:prefs', '{not json')
    const prefs = loadPrefs()
    expect(prefs.theme).toBe('auto')
  })

  it('resolves auto theme from matchMedia', () => {
    const light = resolveTheme('light')
    const dark = resolveTheme('dark')
    expect(light).toBe('light')
    expect(dark).toBe('dark')
  })
})

describe('deriveTitle', () => {
  it('extracts H1', () => {
    expect(deriveTitle('# Hello World')).toBe('Hello World')
  })

  it('extracts H3', () => {
    expect(deriveTitle('### 深度解析')).toBe('深度解析')
  })

  it('uses first non-empty line as fallback', () => {
    expect(deriveTitle('\n\nFirst line content')).toBe('First line content')
  })

  it('returns placeholder for empty input', () => {
    expect(deriveTitle('')).toBe('未命名')
    expect(deriveTitle('\n\n\n')).toBe('未命名')
  })

  it('truncates long first lines', () => {
    const long = 'a'.repeat(100)
    expect(deriveTitle(long)).toHaveLength(40)
  })
})
