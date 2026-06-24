# flow · 流墨

> 极致轻量的 Markdown 编辑器 —— 单 HTML 文件，双击即用，离线可用。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- **零安装**：构建产物是单个 `flowwrite.html`（~310KB），双击在浏览器打开即用
- **离线可用**：所有依赖内联进 HTML，不依赖任何 CDN 或网络
- **即写即存**：自动保存到浏览器 IndexedDB，无需手动 Ctrl+S（Ctrl+S 用于导出 .md 文件）
- **多文档管理**：内置文档列表，支持新建/切换/搜索/删除
- **Markdown 实时编辑**：Typora 式体验，输入 `**粗体**`、`# 标题`、`| 表格 |` 等自动渲染
- **双主题**：浅色（暖纸）/ 深色，跟随系统或手动切换
- **表格支持**：GFM 管道表格语法 `| a | b |`

## 🎮 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开 .md 文件 |
| `Ctrl+S` | 导出为 .md 文件 |
| `Ctrl+N` | 新建文档 |
| `Ctrl+P` | 文档列表 |
| `Ctrl+B` | 粗体 |
| `Ctrl+I` | 斜体 |
| `Ctrl+\` | 清除格式 |
| `F2` | 切换主题 |

## 🚀 使用

### 直接使用（无需开发环境）

下载 [`dist/flowwrite.html`](./dist/flowwrite.html)，双击用浏览器打开即可。

### 从源码构建

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建单 HTML 文件
npm run build
# 产物：dist/flowwrite.html
```

## 🛠 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 框架 | Svelte 5 | runes 模式，编译时优化 |
| 编辑器内核 | Lexical | Meta 出品，原生撤销栈，IME/光标管理完善 |
| Markdown | markdown-it + 自定义 transformer | GFM 表格双向转换 |
| 存储 | idb-keyval (IndexedDB) | 容量远超 localStorage |
| 构建 | Vite + vite-plugin-singlefile | 源码模块化，产物单文件 |
| 语言 | TypeScript | strict 模式 |
| 测试 | Vitest + Playwright | 单元测试 + 端到端 |

## 📦 体积预算

| 项目 | 体积 |
|------|------|
| 构建产物（flowwrite.html） | ~310 KB |
| gzip 后 | ~100 KB |
| 预算上限 | 400 KB |

## 🧪 测试

```bash
# 单元测试
npm test

# 端到端测试
npm run test:e2e
```

## 📁 项目结构

```
flowwrite/
├── src/
│   ├── editor/          # Lexical 编辑器封装
│   │   ├── Editor.svelte
│   │   ├── nodes.ts     # 节点注册
│   │   ├── theme.ts     # 主题类名映射
│   │   └── plugins/     # 编辑器插件
│   ├── components/      # UI 组件
│   ├── storage/         # IndexedDB / localStorage
│   ├── lib/             # 工具函数
│   └── styles/          # 全局样式
├── tests/
│   ├── unit/            # Vitest 单元测试
│   └── e2e/             # Playwright 端到端测试
├── scripts/             # 构建后处理
└── dist/                # 构建产物（gitignore）
```

## 📄 协议

[MIT](./LICENSE)
