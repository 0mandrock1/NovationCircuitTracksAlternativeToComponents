<script setup>
defineProps({
  active: { type: Boolean, default: false },
  playing: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])
</script>

<template>
  <button
    class="step-button"
    :class="{ 'step-button--active': active, 'step-button--playing': playing }"
    @click="emit('click')"
  />
</template>

<style scoped>
.step-button {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.step-button--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.step-button--playing {
  border-color: #fff;
}
</style>
