import { test, expect } from '@playwright/test'
import { focusEditor, editorReady, typeInEditor, pressEnter } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await editorReady(page)
  await focusEditor(page)
})

test('heading on Enter', async ({ page }) => {
  await typeInEditor(page, '# 标题')
  await pressEnter(page)
  await expect(page.locator('.flow-h1')).toContainText('标题')
})

test('H2 on Enter', async ({ page }) => {
  await typeInEditor(page, '## 二级')
  await pressEnter(page)
  await expect(page.locator('.flow-h2')).toContainText('二级')
})

test('unordered list on Enter', async ({ page }) => {
  await typeInEditor(page, '- 列表项')
  await pressEnter(page)
  await expect(page.locator('.flow-ul')).toBeVisible()
})

test('ordered list on Enter', async ({ page }) => {
  await typeInEditor(page, '1. 第一项')
  await pressEnter(page)
  await expect(page.locator('.flow-ol')).toBeVisible()
})

test('quote on Enter', async ({ page }) => {
  await typeInEditor(page, '> 引用内容')
  await pressEnter(page)
  await expect(page.locator('.flow-quote')).toContainText('引用内容')
})

test('inline bold on space', async ({ page }) => {
  await typeInEditor(page, '**粗体** ')
  await expect(page.locator('.flow-bold')).toContainText('粗体')
})

test('inline code on space', async ({ page }) => {
  await typeInEditor(page, '`code` ')
  await expect(page.locator('.flow-code-inline')).toContainText('code')
})
