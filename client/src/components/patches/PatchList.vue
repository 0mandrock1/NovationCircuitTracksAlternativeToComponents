<script setup>
import { usePatchesStore } from '@/stores/patches'

const store = usePatchesStore()
</script>

<template>
  <div class="patch-list">
    <div v-if="store.loading" class="patch-list__loading">Loading patches...</div>
    <ul v-else class="patch-list__items">
      <li
        v-for="(patch, index) in store.patches"
        :key="index"
        class="patch-list__item"
        :class="{ 'patch-list__item--active': store.activePatchIndex === index }"
        @click="store.loadPatch(index)"
      >
        <span class="patch-list__item-num">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="patch-list__item-name">{{ patch.name }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.patch-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 480px;
  overflow-y: auto;
}

.patch-list__loading {
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  text-align: center;
}

.patch-list__items {
  list-style: none;
}

.patch-list__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--color-border);
}

.patch-list__item:last-child {
  border-bottom: none;
}

.patch-list__item:hover {
  background: var(--color-surface-2);
}

.patch-list__item--active {
  background: var(--color-surface-3);
  border-left: 3px solid var(--color-accent);
}

.patch-list__item-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  width: 24px;
  flex-shrink: 0;
}

.patch-list__item-name {
  font-size: 0.9rem;
}
</style>
