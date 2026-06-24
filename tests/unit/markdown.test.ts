import { describe, it, expect } from 'vitest'

// 测试 autoFormatEnter 使用的正则模式
// 实现细节耦合，作为契约测试，方便重构时发现破坏
const HEADING_RE = /^(#{1,6})\s+(.+)$/
const UL_RE = /^[-*+]\s+(.+)$/
const OL_RE = /^(\d+)\.\s+(.+)$/
const QUOTE_RE = /^>\s*(.*)$/

describe('autoFormatEnter patterns', () => {
  describe('heading', () => {
    it.each([
      ['# 标题', 1, '标题'],
      ['## 二级', 2, '二级'],
      ['###### 六级', 6, '六级'],
    ])('matches %s', (input, level, content) => {
      const m = HEADING_RE.exec(input)
      expect(m).not.toBeNull()
      expect(m![1].length).toBe(level)
      expect(m![2]).toBe(content)
    })

    it.each(['#无空格', '####### 七个', '# ', 'plain'])(
      'rejects %s',
      (input) => {
        expect(HEADING_RE.exec(input)).toBeNull()
      },
    )
  })

  describe('unordered list', () => {
    it.each([
      ['- 项目', '项目'],
      ['* 项目', '项目'],
      ['+ 项目', '项目'],
    ])('matches %s', (input, content) => {
      const m = UL_RE.exec(input)
      expect(m).not.toBeNull()
      expect(m![1]).toBe(content)
    })

    it.each(['-无空格', '1. 不是无序'])('rejects %s', (input) => {
      expect(UL_RE.exec(input)).toBeNull()
    })
  })

  describe('ordered list', () => {
    it.each([
      ['1. 第一', '第一'],
      ['42. 第四十二', '第四十二'],
    ])('matches %s', (input, content) => {
      const m = OL_RE.exec(input)
      expect(m).not.toBeNull()
      expect(m![2]).toBe(content)
    })

    it.each(['1.无空格', '一. 不是数字'])('rejects %s', (input) => {
      expect(OL_RE.exec(input)).toBeNull()
    })
  })

  describe('quote', () => {
    it('matches with content', () => {
      const m = QUOTE_RE.exec('> 引用内容')
      expect(m).not.toBeNull()
      expect(m![1]).toBe('引用内容')
    })

    it('matches empty quote', () => {
      const m = QUOTE_RE.exec('>')
      expect(m).not.toBeNull()
    })
  })
})
