<script setup>
defineProps({
  patch: { type: Object, required: true }
})
</script>

<template>
  <div class="mod-matrix">
    <p class="mod-matrix__placeholder">Modulation Matrix — Stage 4</p>
  </div>
</template>

<style scoped>
.mod-matrix {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
.mod-matrix__placeholder { color: var(--color-text-muted); font-size: 0.85rem; }
</style>
