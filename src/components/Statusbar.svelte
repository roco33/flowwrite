<script lang="ts">
  let {
    charCount = 0,
    wordCount = 0,
    saveStatus = 'idle',
    savedAt = null,
    docTitle = '',
  }: {
    charCount?: number
    wordCount?: number
    saveStatus?: 'idle' | 'saving' | 'saved'
    savedAt?: number | null
    docTitle?: string
  } = $props()

  const savedAtLabel = $derived(
    savedAt
      ? new Date(savedAt).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  )
  const readingMinutes = $derived(Math.max(1, Math.ceil(wordCount / 300)))
</script>

<div class="statusbar">
  <span class="item">{wordCount} 字</span>
  <span class="sep">·</span>
  <span class="item">{charCount} 字符</span>
  <span class="sep">·</span>
  <span class="item">约 {readingMinutes} 分钟</span>
  <span class="spacer"></span>
  <span class="shortcuts">
    <kbd>Ctrl+S</kbd> 保存
    <span class="sep">·</span>
    <kbd>Ctrl+O</kbd> 打开
    <span class="sep">·</span>
    <kbd>Ctrl+P</kbd> 切换
    <span class="sep">·</span>
    <kbd>F2</kbd> 主题
  </span>
  <span class="sep">·</span>
  <span class="shortcuts">
    <kbd>Ctrl+B</kbd> 粗体
    <span class="sep">·</span>
    <kbd>Ctrl+I</kbd> 斜体
    <span class="sep">·</span>
    <kbd>Ctrl+\</kbd> 清格式
  </span>
  <span class="sep">·</span>
  <span class="item muted">{docTitle}</span>
  <span class="sep">·</span>
  <span class="item muted">
    {#if saveStatus === 'saving'}
      保存中…
    {:else if saveStatus === 'saved' && savedAt}
      已保存 {savedAtLabel}
    {:else}
      未保存
    {/if}
  </span>
</div>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem;
    font-size: 0.75rem;
    color: var(--flow-fg-muted);
    border-top: 1px solid var(--flow-border);
    background: var(--flow-bg);
  }
  .item {
    white-space: nowrap;
  }
  .muted {
    opacity: 0.85;
  }
  .spacer {
    flex: 1;
  }
  .sep {
    opacity: 0.4;
  }
  .shortcuts {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
  }
  .shortcuts kbd {
    font-family: ui-monospace, 'SF Mono', Consolas, monospace;
    font-size: 0.7rem;
    background: var(--flow-code-bg, rgba(127, 127, 127, 0.15));
    color: var(--flow-fg);
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
    border: 1px solid var(--flow-border);
    line-height: 1.4;
  }
  .shortcuts .sep {
    opacity: 0.4;
  }
</style>
