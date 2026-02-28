<script setup>
defineProps({
  text: { type: String, required: true }
})
</script>

<template>
  <div class="tooltip-wrap">
    <slot />
    <span class="tooltip">{{ text }}</span>
  </div>
</template>

<style scoped>
.tooltip-wrap {
  position: relative;
  display: inline-flex;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 3px 8px;
  font-size: 0.75rem;
  color: var(--color-text);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 100;
}

.tooltip-wrap:hover .tooltip {
  opacity: 1;
}
</style>
