import type { Page } from '@playwright/test'

/**
 * Lexical 在 headless chromium 下不响应 keyboard.type 派发的 beforeinput
 * （selection 同步问题）。绕开原生输入路径，直接通过 __flow API 派发 Lexical 命令。
 */
export async function focusEditor(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const editor = (window as unknown as { __flowEditor?: any }).__flowEditor
      if (!editor) return reject(new Error('editor not ready'))
      editor.focus(
        () => {
          const el = editor.getRootElement() as HTMLElement
          el.focus()
          const range = document.createRange()
          range.selectNodeContents(el)
          range.collapse(false)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
          resolve()
        },
        { defaultSelection: 'rootEnd' },
      )
    })
  })
  await page.waitForTimeout(50)
}

export async function editorReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return Boolean(
      (window as unknown as { __flow?: unknown }).__flow,
    )
  })
}

export async function typeInEditor(
  page: Page,
  text: string,
  _delay = 0,
): Promise<void> {
  await page.evaluate(async (t) => {
    const flow = (window as unknown as {
      __flow?: { typeText: (s: string) => Promise<void> }
    }).__flow
    if (!flow) throw new Error('__flow not ready')
    await flow.typeText(t)
  }, text)
}

export async function pressEnter(page: Page): Promise<void> {
  await page.evaluate(() => {
    const flow = (window as unknown as {
      __flow?: { enter: () => void }
    }).__flow
    if (!flow) throw new Error('__flow not ready')
    flow.enter()
  })
  await page.waitForTimeout(50)
}

export async function pressBackspace(page: Page): Promise<void> {
  await page.evaluate(() => {
    const flow = (window as unknown as {
      __flow?: { backspace: () => void }
    }).__flow
    if (!flow) throw new Error('__flow not ready')
    flow.backspace()
  })
  await page.waitForTimeout(50)
}

export async function pressKey(
  page: Page,
  key: string,
): Promise<void> {
  await page.keyboard.press(key)
}
