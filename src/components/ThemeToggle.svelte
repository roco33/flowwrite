<script lang="ts">
  import type { Theme } from '../storage/prefs'

  let {
    theme = 'auto',
    onChange = () => {},
  }: {
    theme?: Theme
    onChange?: (t: Theme) => void
  } = $props()

  const cycle: Theme[] = ['auto', 'light', 'dark']

  function next() {
    const idx = cycle.indexOf(theme)
    onChange(cycle[(idx + 1) % cycle.length])
  }

  const icon = $derived(
    theme === 'auto' ? '◐' : theme === 'light' ? '☀' : '☾',
  )
  const label = $derived(
    theme === 'auto' ? '自动' : theme === 'light' ? '亮色' : '暗色',
  )
</script>

<button class="theme-toggle" onclick={next} title="主题: {label} (F2)">
  <span class="icon">{icon}</span>
</button>

<style>
  .theme-toggle {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    color: var(--flow-fg);
  }
  .theme-toggle:hover {
    background: var(--flow-hover-bg);
  }
</style>
