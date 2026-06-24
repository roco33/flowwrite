import { test, expect } from '@playwright/test'
import { focusEditor, editorReady, typeInEditor, pressEnter, pressBackspace, pressKey } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await editorReady(page)
  await focusEditor(page)
})

test('bold: delete text first, then format', async ({ page }) => {
  await typeInEditor(page, '**好的** ')
  await expect(page.locator('.flow-bold')).toContainText('好的')

  // Backspace：先删空格 + "好的"（3 次）
  await pressBackspace(page) // space
  await pressBackspace(page) // 的
  await pressBackspace(page) // 好
  // 此时粗体外壳空了

  // 再次 Backspace：消除粗体格式
  await pressBackspace(page)
  await expect(page.locator('.flow-bold')).toHaveCount(0)
})

test('heading: delete text then downgrade', async ({ page }) => {
  await typeInEditor(page, '# 标题')
  await pressEnter(page)
  await expect(page.locator('.flow-h1')).toContainText('标题')

  // 光标移到 H1 行末，连续 Backspace 删完文字
  await pressKey(page, 'ArrowLeft')
  for (let i = 0; i < '标题'.length; i++) {
    await pressBackspace(page)
  }
  // 文字空了，再次 Backspace 应该降级
  await pressBackspace(page)
  await expect(page.locator('.flow-h1')).toHaveCount(0)
})

test('quote: delete text then downgrade', async ({ page }) => {
  await typeInEditor(page, '> 引用')
  await pressEnter(page)
  await expect(page.locator('.flow-quote')).toContainText('引用')

  await pressKey(page, 'ArrowLeft')
  for (let i = 0; i < '引用'.length; i++) {
    await pressBackspace(page)
  }
  await pressBackspace(page)
  await expect(page.locator('.flow-quote')).toHaveCount(0)
})
