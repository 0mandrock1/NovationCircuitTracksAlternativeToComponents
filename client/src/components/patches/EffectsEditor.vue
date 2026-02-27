<script setup>
defineProps({
  patch: { type: Object, required: true }
})
</script>

<template>
  <div class="effects-editor">
    <p class="effects-editor__placeholder">Effects Editor — Stage 4</p>
  </div>
</template>

<style scoped>
.effects-editor {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
.effects-editor__placeholder { color: var(--color-text-muted); font-size: 0.85rem; }
</style>
