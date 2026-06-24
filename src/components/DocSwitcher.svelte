<script lang="ts">
  import type { Doc } from '../storage/docs'

  let {
    docs = [],
    currentId = null,
    onOpen = () => {},
    onDelete = () => {},
    onCreate = () => {},
    onClose = () => {},
  }: {
    docs?: Doc[]
    currentId?: string | null
    onOpen?: (id: string) => void
    onDelete?: (id: string) => void
    onCreate?: () => void
    onClose?: () => void
  } = $props()

  let query = $state('')

  const filtered = $derived(
    query
      ? docs.filter((d) =>
          d.title.toLowerCase().includes(query.toLowerCase()),
        )
      : docs,
  )

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  function handleDelete(e: MouseEvent, doc: Doc) {
    e.stopPropagation()
    if (confirm(`确认删除「${doc.title}」？此操作不可撤销。`)) {
      onDelete(doc.id)
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" onclick={onClose} onkeydown={handleKeydown} role="presentation">
  <div class="panel" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
    <header>
      <input
        type="text"
        placeholder="搜索文档..."
        bind:value={query}
        class="search"
      />
      <button class="new-btn" onclick={onCreate}>新建</button>
      <button class="close-btn" onclick={onClose} title="关闭 (Esc)">✕</button>
    </header>
    <ul class="doc-list">
      {#each filtered as doc (doc.id)}
        <li>
          <button
            class="item"
            class:active={doc.id === currentId}
            onclick={() => onOpen(doc.id)}
          >
            <span class="title">{doc.title}</span>
            <span class="meta">
              {new Date(doc.updatedAt).toLocaleString('zh-CN')}
            </span>
          </button>
          <button
            class="del"
            onclick={(e) => handleDelete(e, doc)}
            title="删除文档"
            aria-label="删除文档">✕</button>
        </li>
      {:else}
        <li class="empty">{docs.length === 0 ? '暂无文档' : '无匹配结果'}</li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 12vh;
    z-index: 100;
  }
  .panel {
    background: var(--flow-bg-elevated, var(--flow-bg));
    border: 1px solid var(--flow-border);
    border-radius: 8px;
    width: 480px;
    max-width: 92vw;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  header {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--flow-border);
  }
  .search {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--flow-border);
    border-radius: 4px;
    background: var(--flow-bg);
    color: var(--flow-fg);
    font-size: 0.9rem;
  }
  .new-btn,
  .close-btn {
    background: transparent;
    border: 1px solid var(--flow-border);
    border-radius: 4px;
    cursor: pointer;
    padding: 0.35rem 0.7rem;
    color: var(--flow-fg);
  }
  .doc-list {
    list-style: none;
    margin: 0;
    padding: 0.25rem;
    overflow-y: auto;
    flex: 1;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .item {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    text-align: left;
    color: var(--flow-fg);
  }
  .item:hover {
    background: var(--flow-hover-bg);
  }
  .item.active {
    background: var(--flow-active-bg);
  }
  .title {
    font-weight: 500;
  }
  .meta {
    font-size: 0.75rem;
    color: var(--flow-fg-muted);
  }
  .del {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.35rem;
    border-radius: 4px;
    color: var(--flow-fg-muted);
  }
  .del:hover {
    background: var(--flow-hover-bg);
    color: var(--flow-fg);
  }
  .empty {
    padding: 2rem;
    text-align: center;
    color: var(--flow-fg-muted);
    list-style: none;
  }
</style>
