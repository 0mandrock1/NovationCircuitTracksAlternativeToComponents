<script setup>
defineProps({
  projectIndex: { type: Number, required: true }
})
</script>

<template>
  <div class="scene-list">
    <p class="scene-list__placeholder">Scene List — Stage 9</p>
  </div>
</template>

<style scoped>
.scene-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
.scene-list__placeholder { color: var(--color-text-muted); font-size: 0.85rem; }
</style>
