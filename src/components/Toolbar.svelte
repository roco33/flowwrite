<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte'
  import type { Theme } from '../storage/prefs'

  let {
    theme = 'auto',
    onOpen = () => {},
    onSave = () => {},
    onNew = () => {},
    onSwitchDoc = () => {},
    onToggleTheme = () => {},
  }: {
    theme?: Theme
    onOpen?: () => void
    onSave?: () => void
    onNew?: () => void
    onSwitchDoc?: () => void
    onToggleTheme?: (t: Theme) => void
  } = $props()
</script>

  <div class="toolbar">
  <button class="btn" onclick={onOpen} title="打开 (Ctrl+O)">
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 4.5h3.5l1.5 1.5H14v7H2z" />
    </svg>
  </button>
  <button class="btn" onclick={onSave} title="保存 (Ctrl+S)">
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <path d="M4.5 2.5v4h6v-4" />
      <path d="M5.5 9h5v4.5h-5z" />
    </svg>
  </button>
  <button class="btn" onclick={onNew} title="新建文档 (Ctrl+N)">＋</button>
  <button class="btn" onclick={onSwitchDoc} title="文档列表 (Ctrl+P)">☰</button>
  <span class="divider"></span>
  <ThemeToggle {theme} onChange={onToggleTheme} />
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.6rem;
    background: var(--flow-bg);
    border-bottom: 1px solid var(--flow-border);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.35rem 0.55rem;
    border-radius: 4px;
    color: var(--flow-fg);
    transition: background 0.1s;
  }
  .btn svg {
    display: block;
  }
  .btn:hover {
    background: var(--flow-hover-bg);
  }
  .divider {
    width: 1px;
    height: 18px;
    background: var(--flow-border);
    margin: 0 0.25rem;
  }
</style>
