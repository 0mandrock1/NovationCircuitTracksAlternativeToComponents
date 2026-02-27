<script setup>
defineProps({
  patch: { type: Object, required: true }
})
defineEmits(['update:patch'])
</script>

<template>
  <div class="synth-editor">
    <p class="synth-editor__placeholder">Synth Editor — Stage 3</p>
  </div>
</template>

<style scoped>
.synth-editor {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
.synth-editor__placeholder {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>
