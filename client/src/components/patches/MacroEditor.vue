<script setup>
defineProps({
  patch: { type: Object, required: true }
})
</script>

<template>
  <div class="macro-editor">
    <p class="macro-editor__placeholder">Macro Editor — Stage 3</p>
  </div>
</template>

<style scoped>
.macro-editor {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
.macro-editor__placeholder { color: var(--color-text-muted); font-size: 0.85rem; }
</style>
