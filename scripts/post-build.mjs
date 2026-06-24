import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'

const from = 'dist/index.html'
const to = 'dist/flowwrite.html'

if (!existsSync(from)) {
  console.error(`[post-build] ${from} not found`)
  process.exit(1)
}

// 先复制，再对 flowwrite.html 做 file:// 兼容性修正
copyFileSync(from, to)

let html = readFileSync(to, 'utf8')

// vite-plugin-singlefile 给内联 <style> 加了 crossorigin 属性。
// file:// 协议下每个文件是独立 opaque origin，crossorigin 会导致样式表被
// 浏览器拒绝应用（CORS 策略），表现为页面无样式、布局塌陷。
// 移除 <style> 上的 crossorigin 让双击打开的单 HTML 正常工作。
const before = html
html = html.replace(
  /(<style[^>]*?)\s+crossorigin(="[^"]*")?/gi,
  '$1',
)

// 同样移除内联 <script> 上的 crossorigin（预防同样问题）
html = html.replace(
  /(<script[^>]*?)\s+crossorigin(="[^"]*")?/gi,
  '$1',
)

if (html !== before) {
  writeFileSync(to, html)
  console.log('[post-build] Stripped crossorigin from inline <style>/<script> for file:// compat')
}

console.log(`[post-build] Copied ${from} → ${to}`)
