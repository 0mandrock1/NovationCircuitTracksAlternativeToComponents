<script setup>
defineProps({
  sample: { type: Object, required: true },
  index: { type: Number, required: true }
})
</script>

<template>
  <li class="sample-item">
    <span class="sample-item__num">{{ String(index + 1).padStart(2, '0') }}</span>
    <span class="sample-item__name">{{ sample.name }}</span>
    <span class="sample-item__size">{{ sample.size ? `${(sample.size / 1024).toFixed(1)}KB` : '—' }}</span>
  </li>
</template>

<style scoped>
.sample-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  cursor: pointer;
}

.sample-item:last-child {
  border-bottom: none;
}

.sample-item:hover {
  background: var(--color-surface-2);
}

.sample-item__num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  width: 24px;
  flex-shrink: 0;
}

.sample-item__name {
  flex: 1;
  font-size: 0.9rem;
}

.sample-item__size {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
