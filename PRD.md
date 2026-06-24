# flow · 流墨 — PRD

## 1. 产品定位

一个 Windows 下**极致轻量**的 Markdown 编辑器。

- **用户视角**：单 HTML 文件，双击即用，零安装、零依赖、完全离线。
- **产物体积目标**：< 400 KB（gzip 后约 120 KB）。
- **便携性**：可放 U 盘、可邮件附件、可扔 GitHub Release。
- **开发视角**：源码是完整的现代前端工程（TS + 模块化 + 构建），产物是单 HTML。开发者拿到工程，用户拿到一个文件。

## 2. 设计哲学

| 原则 | 含义 |
|------|------|
| 心流 | 界面极简、零干扰，用户所见即所想 |
| Typora 式 | 单窗格实时渲染：输入 `# 标题` 回车即变大，不需要切分屏 |
| 少即是多 | 默认只保留一个编辑窗格，隐藏一切非必要元素 |
| 单文件即应用 | 源码现代工程、产物单 HTML。用户视角与开发视角解耦 |

## 3. 功能清单

### 3.1 已发布且稳定（v0.x，基于 contenteditable）

> 注：v1.0 将基于 Lexical 重写内核，下列产品行为不变，但实现迁移。

| 功能 | 说明 |
|------|------|
| 主题切换 | F2 / ◐ 按钮，暖纸 / 深色 / 自动跟随系统 |
| 文件打开 | 📂 按钮 / Ctrl+O，选择 .md 文件读入 |
| 文件保存 | 💾 按钮 / Ctrl+S，优先 File System Access API，降级下载 |
| 多文档管理 | Ctrl+P 打开文档切换面板，支持搜索 / 删除 / 新建 |
| 本地缓存 | 自动保存所有文档，800 ms 防抖 |
| 专注模式 | F1 隐藏工具栏和状态栏 |
| 粘贴净化 | 粘贴自动去除富文本格式 |
| 标题派生 | 输入 `# 标题` 后自动提取为文档标题 |
| 统计 | 底部实时显示中文字数 + 字符数 |

### 3.2 Enter 自动格式化

| 输入 | 回车后效果 | 状态 |
|------|-----------|------|
| `# 标题` | 大号 H1 | ✅ 稳定 |
| `## 二级` | H2 | ✅ |
| `- 列表` | 无序列表 | ✅ |
| `1. 列表` | 有序列表 | ✅ |
| `> 引用` | 引用块 | ✅ |
| 空列表项回车 | 退出列表 | ✅ |

### 3.3 行内自动格式化

| 输入 | 期望效果 | 状态 |
|------|---------|------|
| `**好的**` 继续打字 | 粗体后继续正常体 | 🚧 v1.0 重写 |
| `*斜体*` 继续打字 | 斜体后继续正常体 | 🚧 v1.0 重写 |
| `` `代码` `` 继续打字 | 代码后继续正常体 | 🚧 v1.0 重写 |
| 回车后 | 新段落正常体 | ✅ |

**Backspace 消费顺序（硬约束）**：在已格式化的范围内，Backspace 按以下顺序消费，**先文字、后格式**：

1. **文字存在时**：每次 Backspace 删除一个字符，格式保留。
2. **文字清空后**：下一次 Backspace 才消除格式外壳，恢复成普通段落。

具体序列：

| 操作 | 内容状态 |
|------|---------|
| 初始 | `好的`（粗体） |
| Backspace ×1 | `好`（粗体） |
| Backspace ×2 | `` （空的粗体外壳） |
| Backspace ×3 | `` （普通段落，格式消除） |

适用范围：

- 行内格式（粗体 / 斜体 / 代码 / 删除线）：文字删空 → Backspace 消除标记。
- 链接：文字删空 → Backspace 拆解为空链接或纯 URL。
- 块级（标题 / 列表 / 引用 / 代码块）：行内文字删空 → Backspace 把块降级（H1 → 普通段落、列表项 → 普通段落、引用 → 普通段落）。

实现要点：

- 监听 Backspace 事件，在 Lexical 节点处理器中判断：节点有文字 → 走默认删除；节点文字为空 + 节点带格式 → 调用 `transform()` 把节点降级为普通段落 / TextNode。
- 注意与浏览器原生"跨格式边界 Backspace"行为协同，避免光标位置丢失。

验收：E2E 用例 `backspace-format-consume.spec.ts` —— 多种格式下连续 Backspace，逐次断言状态符合上表消费顺序。

### 3.4 格式清除

**方案**：`Ctrl+\` 清除选区内所有格式（粗体 / 斜体 / 标题 / 列表 / 引用 / 链接 / 代码等），保留纯文本内容。

- 有选区：作用于选区。
- 无选区：作用于当前行。
- 实现路径：选区内容走 Markdown round-trip（DOM → Markdown → 纯文本）。

### 3.5 v1.0 计划新增

| 功能 | 触发方式 | 说明 |
|------|---------|------|
| 查找 | Ctrl+F | 浮层搜索框，支持正则、大小写 |
| 替换 | Ctrl+H | 查找 + 替换 / 全部替换 |
| 撤销 | Ctrl+Z | Lexical 原生 undo 栈 |
| 重做 | Ctrl+Y / Ctrl+Shift+Z | 同上 |
| 图片粘贴 | Ctrl+V | 剪贴板图片直接插入，存 IndexedDB |
| 图片拖拽 | 拖入文件 | 支持拖入图片文件 |
| 表格输入 | `\|...\|` 语法 | 创建 / 扩展 Markdown 表格 |
| 自动保存状态 | 状态栏 | 显示"保存中" / "已保存 HH:MM" |
| 崩溃恢复 | 启动时 | 检测异常退出会话，提示恢复 |
| 阅读时间 | 状态栏 | 基于 300 字 / 分钟估算 |
| 拖拽打开 .md | 拖入 .md 文件 | 直接读入为新文档 |

### 3.6 v1.x 候选（未排期）

- 多窗口 / 多标签并行打开
- 文档版本历史
- PDF 导出
- 自定义 CSS 主题
- 大纲（TOC）侧栏
- 全局快捷键唤起

## 4. 技术架构

### 4.1 双层架构

```
源码（开发视角）                      产物（用户视角）
another_md_reader/                    flowwrite.html
├── src/                               ↑ 单 HTML，一切 inline
│   ├── main.ts                         JS / CSS / 依赖全部塞进一个文件
│   ├── App.svelte                      双击即用、完全离线
│   ├── editor/
│   ├── storage/
│   ├── components/
│   └── styles/
├── tests/
├── package.json
└── dist/flowwrite.html（构建产物）
```

**关键约束**：用户拿到的永远是单 HTML。开发视角的复杂度不外溢给用户。

### 4.2 技术栈选型

| 层 | 选型 | 体积(gzip) | 选型理由 |
|----|------|-----------|---------|
| 构建 | Vite + vite-plugin-singlefile | 0 | 最成熟的"打包成单 HTML"方案 |
| 语言 | TypeScript | 0 | 编辑器状态复杂，TS 是"少 bug"的最大杠杆 |
| UI 框架 | Svelte 5 | ~5 KB | 编译时优化、运行时极小，最配轻量定位 |
| 编辑器内核 | Lexical | ~40 KB | WYSIWYG、原生 undo、IME 处理稳，长线 bug 少 |
| Markdown 解析 | markdown-it | ~25 KB | AST 完整，行内 / 块级解析精准 |
| 存储 | idb-keyval（IndexedDB） | ~1 KB | 容量数百 MB，API 近似 localStorage |
| 测试 | Vitest + Playwright | 0 (dev) | 关键函数单测 + 真实浏览器 E2E |
| 字体 | 系统字体栈 | 0 | system-ui / ui-monospace，不内联字体 |

**不选的理由**：
- React / Vue：运行时偏重，违背轻量定位
- 裸 contenteditable + execCommand：execCommand 已废弃，IME / 光标 / 撤销坑多
- Electron / Tauri：需要安装，违背"双击即用"哲学
- marked：AST 不暴露，做 WYSIWYG 时定位困难
- 内联字体（Inter / JetBrains Mono）：动辄数百 KB

### 4.3 体积预算

| 项 | gzip | 原始 |
|----|------|------|
| HTML 框架 | ~5 KB | ~10 KB |
| CSS（双主题） | ~10 KB | ~30 KB |
| Svelte runtime | ~5 KB | ~15 KB |
| Lexical | ~40 KB | ~120 KB |
| markdown-it | ~25 KB | ~80 KB |
| idb-keyval | ~1 KB | ~3 KB |
| 应用代码 | ~30 KB | ~90 KB |
| **合计** | **~120 KB** | **~350 KB** |

超预算时的削减优先级：
1. 砍 Lexical → 裸 contenteditable（省 ~40 KB gzip，代价是 IME / 撤销坑回来）
2. 砍 markdown-it → marked（省 ~10 KB gzip，代价是 AST 不暴露）
3. 砍 Svelte → 纯 TS（省 ~5 KB gzip，代价是 UI 写起来啰嗦）

### 4.4 目录结构

```
another_md_reader/
├── src/
│   ├── main.ts                  # 入口，挂载 Svelte 应用
│   ├── App.svelte               # 主界面（工具栏 + 编辑区 + 状态栏）
│   ├── editor/
│   │   ├── Editor.svelte        # Lexical 封装
│   │   ├── plugins/             # Enter 格式化、行内格式化等
│   │   └── commands.ts          # format(cmd) 抽象层
│   ├── storage/
│   │   ├── docs.ts              # 文档 CRUD（IndexedDB）
│   │   └── prefs.ts             # 用户偏好（localStorage）
│   ├── components/
│   │   ├── Toolbar.svelte
│   │   ├── Statusbar.svelte
│   │   ├── DocSwitcher.svelte   # Ctrl+P 面板
│   │   ├── FindReplace.svelte   # Ctrl+F/H 浮层
│   │   └── ThemeToggle.svelte
│   ├── styles/
│   │   ├── theme.css            # CSS 变量 + 双主题
│   │   ├── editor.css           # 编辑区渲染样式
│   │   └── ui.css               # 工具栏 / 状态栏 / 面板
│   └── lib/
│       ├── markdown.ts          # markdown-it 封装
│       ├── shortcuts.ts         # 快捷键注册
│       └── debounce.ts
├── tests/
│   ├── unit/                    # Vitest
│   └── e2e/                     # Playwright
├── vite.config.ts
├── tsconfig.json
├── package.json
├── PRD.md
└── dist/
    └── flowwrite.html           # 唯一发布产物
```

### 4.5 数据层

| 数据类别 | 存放 | 说明 |
|---------|------|------|
| 文档内容 | IndexedDB（idb-keyval） | 容量大、异步、不阻塞主线程 |
| 图片资源 | IndexedDB（单独 object store） | Blob 形式，避免 base64 膨胀 |
| 用户偏好（主题 / 专注模式等） | localStorage | 小数据、同步读取合适 |
| 最后活跃文档 id | localStorage | 启动时快速恢复 |

降级策略：隐私模式下 IndexedDB 可能不可用，检测失败后降级到 localStorage（仅纯文本、提示用户）。

## 5. 快捷键完整表

### 格式化

| 快捷键 | 操作 |
|--------|------|
| Ctrl+B | 粗体 |
| Ctrl+I | 斜体 |
| Ctrl+U | 下划线 |
| Ctrl+Shift+X | 删除线 |
| Ctrl+K | 插入链接 |
| Ctrl+Shift+1~6 | 设置标题级别 |
| Ctrl+Shift+[ / ] | 升降标题级别 |
| Ctrl+Shift+L | 无序列表 |
| Ctrl+Shift+O | 有序列表 |
| Ctrl+Shift+Q | 引用块 |
| Ctrl+Shift+C | 代码块 |
| Ctrl+\ | 清除格式（v1.0 新增） |
| Tab / Shift+Tab | 缩进 / 减少缩进 |

### 编辑（v1.0 新增）

| 快捷键 | 操作 |
|--------|------|
| Ctrl+Z | 撤销 |
| Ctrl+Y / Ctrl+Shift+Z | 重做 |
| Ctrl+F | 查找 |
| Ctrl+H | 替换 |

### 文档操作

| 快捷键 | 操作 |
|--------|------|
| Ctrl+N | 新建文档 |
| Ctrl+S | 保存文件 |
| Ctrl+O | 打开文件 |
| Ctrl+P | 文档列表 |

### 视图

| 快捷键 | 操作 |
|--------|------|
| F1 | 专注模式 |
| F2 | 主题切换 |

## 6. 已知风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 中文 IME 输入抖动 | 光标跳、字符丢 | Lexical 内置 IME 处理，远比裸 contenteditable 稳 |
| 复制粘贴富文本残留 | 粘贴带样式污染 | 自定义 paste handler，强制走 Markdown round-trip |
| Tab 焦点跳出编辑器 | 列表 / 缩进失效 | Lexical 拦截 Tab，不依赖浏览器默认 |
| IndexedDB 配额满 | 写入失败 | 监控配额 + 状态栏警告 + 一键导出兜底 |
| 隐私模式 IndexedDB 不可用 | 无法持久化 | 检测后降级 localStorage，提示用户 |
| 依赖大版本升级破坏 | 构建产物突然坏 | package-lock.json 锁版本 + CI 跑测试 |
| 浏览器撤销栈与自定义命令冲突 | 撤销行为混乱 | 统一走 Lexical undo 栈，禁用 execCommand |
| 构建工具版本漂移 | 产物体积突增 | Vite / 插件版本一并锁，定期 audit |

## 7. 工程化

### 7.1 脚本

```
npm run dev        # Vite 热重载开发
npm test           # Vitest 单测
npm run test:e2e   # Playwright 端到端
npm run build      # 产出 dist/flowwrite.html
npm run preview    # 预览构建产物
```

### 7.2 测试覆盖

- **单元测试（Vitest）**：Markdown 解析、标题派生、文档存储读写、防抖逻辑、快捷键映射
- **E2E 测试（Playwright）**：Enter 自动格式化、行内格式化、Ctrl+B/I/K、Tab、Ctrl+P 面板、Ctrl+F/H、图片粘贴、崩溃恢复
- **构建断言**：CI 检查 `dist/flowwrite.html` 体积 < 400 KB

### 7.3 发布

- 发布物只有一个文件：`dist/flowwrite.html`
- 不签名、不打包成 exe、不上架商店
- 分发渠道：GitHub Release / 邮件 / U 盘 / 网盘

### 7.4 版本策略

- 语义化版本：`MAJOR.MINOR.PATCH`
- 产品行为 / PRD 变更 → MINOR+
- 内部重构、bug 修复 → PATCH
- 不破坏用户数据格式的前提下，可平替升级

## 8. 里程碑

| 版本 | 目标 | 核心交付 |
|------|------|---------|
| v1.0-alpha | 内核切换 | Lexical 骨架 + 现有产品行为全部迁移 |
| v1.0-beta | 补缺口 | 查找替换、撤销重做、图片粘贴、表格、自动保存状态、崩溃恢复 |
| v1.0 | 稳定 | 全部 E2E 通过、产物 < 400 KB、文档迁移零丢失 |
| v1.x | 增强 | 大纲、PDF 导出、版本历史等候选功能择优先做 |
