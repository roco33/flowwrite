import { test, expect } from '@playwright/test'
import { focusEditor, editorReady, typeInEditor, pressBackspace } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await editorReady(page)
  await focusEditor(page)
})

const TABLE_MD = '| 名字 | 年龄 |\n| --- | --- |\n| 张三 | 18 |\n| 李四 | 25 |'

async function loadMd(page: import('@playwright/test').Page, md: string) {
  await page.evaluate((m) => {
    const flow = (window as unknown as {
      __flow?: { loadMarkdown: (s: string) => void }
    }).__flow
    if (!flow) throw new Error('__flow not ready')
    flow.loadMarkdown(m)
  }, md)
  await page.waitForTimeout(200)
}

// 验证表格从 markdown 渲染
test('table renders from markdown import', async ({ page }) => {
  await loadMd(page, TABLE_MD)

  const table = page.locator('.flow-table')
  await expect(table).toBeVisible()
  await expect(table.locator('.flow-th').nth(0)).toContainText('名字')
  await expect(table.locator('.flow-th').nth(1)).toContainText('年龄')
  // 数据单元格用 :not(.flow-th) 排除表头（表头同时带 flow-td 类）
  const dataCells = table.locator('.flow-td:not(.flow-th)')
  await expect(dataCells.nth(0)).toContainText('张三')
  await expect(dataCells.nth(1)).toContainText('18')
  await expect(dataCells.nth(2)).toContainText('李四')
  await expect(dataCells.nth(3)).toContainText('25')
})

// 验证表格序列化为 markdown（round-trip）
test('table serializes to markdown', async ({ page }) => {
  await loadMd(page, '| A | B |\n| --- | --- |\n| 1 | 2 |')

  const md = await page.evaluate(() => {
    const flow = (window as unknown as {
      __flow?: { getMarkdown: () => string }
    }).__flow
    if (!flow) throw new Error('__flow not ready')
    return flow.getMarkdown()
  })

  expect(md).toContain('| A | B |')
  expect(md).toContain('---')
  expect(md).toContain('| 1 | 2 |')
})

// 验证表格内单元格可输入文字
test('cell is editable', async ({ page }) => {
  await loadMd(page, '| C |\n| --- |\n| x |')

  const cell = page.locator('.flow-td:not(.flow-th)').first()
  await cell.click()
  await page.waitForTimeout(50)
  await typeInEditor(page, 'Y')
  await page.waitForTimeout(100)
  await expect(cell).toContainText('Y')
})

// 验证 Backspace 在空表格上删除整个表格
test('backspace removes empty table', async ({ page }) => {
  await loadMd(page, '|  |  |\n| --- | --- |\n|  |  |')

  await expect(page.locator('.flow-table')).toBeVisible()

  const cell = page.locator('.flow-td:not(.flow-th)').first()
  await cell.click()
  await page.waitForTimeout(50)
  await pressBackspace(page)
  await page.waitForTimeout(100)

  await expect(page.locator('.flow-table')).toHaveCount(0)
})
