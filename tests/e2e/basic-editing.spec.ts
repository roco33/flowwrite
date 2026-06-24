import { test, expect } from '@playwright/test'
import { focusEditor, editorReady, typeInEditor } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await editorReady(page)
})

test('editor mounts and accepts input', async ({ page }) => {
  const editor = page.locator('.flow-editor-shell')
  await expect(editor).toBeVisible()
  await focusEditor(page)
  await typeInEditor(page, 'hello world')
  await expect(editor).toContainText('hello world')
})

test('toolbar and statusbar render', async ({ page }) => {
  await expect(page.locator('.toolbar')).toBeVisible()
  await expect(page.locator('.statusbar')).toBeVisible()
})

test('word count updates on input', async ({ page }) => {
  const editor = page.locator('.flow-editor-shell')
  await focusEditor(page)
  await typeInEditor(page, '测试文字 count')
  await expect(page.locator('.statusbar')).toContainText(/\d+ 字/)
})
