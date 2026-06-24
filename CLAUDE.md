# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

**flowwrite / 流墨** — 单 HTML Markdown 编辑器。源码是完整 TS + Svelte 工程，构建产物是一个自包含的 `dist/flowwrite.html`（双击即用、完全离线、< 400 KB）。PRD 在 `PRD.md`。

## 常用命令

```bash
npm run dev          # Vite 开发服务器（HMR）
npm run build        # 构建 dist/index.html → post-build 复制为 dist/flowwrite.html
npm run preview      # 预览构建产物（E2E 用这个，不是 dev）
npm run check:size   # 验证 dist/flowwrite.html ≤ 400 KB
npm run check        # svelte-check 类型检查
npm test             # Vitest 单测（tests/unit/）
npm run test:e2e     # Playwright E2E（tests/e2e/）

# 跑单个测试：
npx vitest run tests/unit/debounce.test.ts
npx playwright test tests/e2e/auto-format.spec.ts --reporter=list
```

## 关键架构

### 构建链（容易踩坑的部分）

`vite.config.ts` 用 `viteSingleFile` 把所有 JS/CSS inline 到一个 HTML。`vite build` 产物是 `dist/index.html`，`scripts/post-build.mjs` 再复制为 `dist/flowwrite.html`（保留 index.html 让 `vite preview` 能服务）。

**Playwright `webServer` 跑的是 `npm run preview`，服务的是构建产物不是源码**。改了源码后必须 `npm run build` 重新构建，E2E 才能看到变化。`assetsInlineLimit: 100_000_000` 是为了强制所有资源 inline。

### Lexical 集成模式

**不是**用 `<RichTextPlugin>` 组件包装，而是 `Editor.svelte` 用裸 `createEditor()` + 手动调 `registerRichText(editor)` 注册所有默认命令处理（DELETE_CHARACTER、INSERT_PARAGRAPH 等）。不调 `registerRichText` 的话 Enter 不换段、Backspace 不删字符——只有自定义的 markdown shortcut 在工作。

插件通过 `editor.registerCommand(cmd, handler, priority)` 注册，cleanup 函数收集在 `cleanups[]` 里，`onDestroy` 时统一调用。所有插件以 `attachXxx(editor): () => void` 形式封装，位于 `src/editor/plugins/`。

### Svelte 5 + Lexical $ 前缀冲突

Svelte 5 runes 占用 `$` 前缀（`$state`/`$derived`/`$props`/`$effect`）。从 Lexical 导入的 `$getRoot`、`$convertToMarkdownString`、`$getSelection` 等**必须用别名**：

```ts
import { $getRoot as getRoot, $getSelection as getSelection } from 'lexical'
import { $convertToMarkdownString as serializeMarkdown, $convertFromMarkdownString as parseMarkdown } from '@lexical/markdown'
```

否则 Svelte 编译器会误解为 rune。

### 命令优先级（自定义插件 vs registerRichText）

Lexical 命令按 priority 高优先级先执行；返回 true 则跳过低优先级 handler。

- `registerRichText` 的 KEY_BACKSPACE/KEY_ENTER 等在 `COMMAND_PRIORITY_EDITOR`
- 自定义插件 `backspaceConsume` 用 `COMMAND_PRIORITY_CRITICAL` 才能在 rich-text 默认 handler 之前拦截
- `autoFormatEnter` 在 `COMMAND_PRIORITY_LOW`（rich-text 的 Enter handler 已经 INSERT_PARAGRAPH，markdown 转换主要靠 typing 时的 inline shortcut 完成，Enter handler 是兜底）

### 数据层 Proxy 陷阱（关键 bug 源）

Svelte 5 `$state` 包装的对象是 Proxy。`IndexedDB` 的 `structured clone` 不支持 Proxy，写入会抛 `could not be cloned`，**async function 内部抛错会导致 UI 看似无反应**（按钮点了没效果但没报错提示）。

`src/storage/docs.ts` 的 `saveDoc` 已经把 Doc 解构成 plain object 再写入。任何新加的 IndexedDB 写入函数都要这样做。`savePrefs` 用 `JSON.stringify` 自动解 Proxy，没问题。

### Backspace 消费顺序（PRD 3.3 硬约束）

PRD 要求：Backspace 先删文字，文字清空后才消除格式外壳。实现见 `src/editor/plugins/backspaceConsume.ts`：

1. KEY_BACKSPACE_COMMAND handler（CRITICAL 优先级）：
   - 空 TextNode + inline 格式 → 清格式
   - 空块节点（H1/Quote/Code/ListItem）→ 降级为 paragraph（需要从 anchor 向上找父块节点，因为 anchor 指向 TextNode 而非块节点本身）
2. update listener：Backspace 后若光标停在 inline 格式化节点末尾，`toggleFormat` 清除对应位——避免 Lexical 的"格式延续"导致新字符继承 italic/bold

## 测试基础设施

### E2E 的 `__flow` API

Lexical 在 headless Chromium 下不响应 `keyboard.type` 派发的 beforeinput（selection 同步问题）。`Editor.svelte` 把 `__flow` API 挂到 window：

- `typeText(text)`: **按字符**插入（不能批量！Lexical markdown shortcut 监听器要求 cursor offset 增量 ≤ 1，批量插入跳过转换）
- `enter()`: dispatchCommand(KEY_ENTER_COMMAND)
- `backspace()`: dispatchCommand(KEY_BACKSPACE_COMMAND)

`tests/e2e/helpers.ts` 提供 `typeInEditor` / `pressEnter` / `pressBackspace` 包装这些。`editorReady` 等待 `window.__flow` 而非 `__flowEditor`。

### 测试与 preview

E2E 通过 `npm run preview` 服务构建产物，所以改代码后必须 rebuild。Vitest 单测走源码，不需要 build。

## 主要数据流

`App.svelte` 是顶层：
- `editor: LexicalEditor | null`（**非 $state**，因为只用于事件 handler 内访问，不需要触发重渲染）
- `currentDoc = $state<Doc | null>`、`docs = $state<Doc[]>`、`theme = $state<Theme>` 等响应式状态
- 全局快捷键在 `handleGlobalKeydown`（Ctrl+O/S/N/P, F1/F2）
- 文档自动保存：Editor 的 `onChange` 回调 → debounce 800ms → `saveDoc(currentDoc)`
- `loadDocIntoEditor` 用 `editor.update({ tag: 'historic' })` 加载，避免污染 undo 栈

Editor.svelte 暴露 `__flowEditor` 和 `__flow` 到 window（仅供测试用，prod 也保留——少量字节开销，方便调试）。

## 命名 / 风格约定

- Lexical CSS class 用 `flow-*` 前缀（如 `.flow-h1`、`.flow-bold`、`.flow-quote`），定义在 `src/editor/theme.ts` 和 `Editor.svelte` 的 `<style>`
- CSS 变量用 `--flow-*` 前缀（如 `--flow-bg`、`--flow-fg`、`--flow-border`），双主题在 `src/styles/main.css`
- 中文注释和 UI 文案（产品定位是中文用户）
