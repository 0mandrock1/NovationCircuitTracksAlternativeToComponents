<script setup>
defineProps({
  channel: { type: Object, required: true },
  index: { type: Number, required: true }
})
</script>

<template>
  <div class="fx-sends">
    <p class="fx-sends__placeholder">FX Sends — Stage 7</p>
  </div>
</template>

<style scoped>
.fx-sends {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
}
.fx-sends__placeholder { color: var(--color-text-muted); font-size: 0.75rem; }
</style>
