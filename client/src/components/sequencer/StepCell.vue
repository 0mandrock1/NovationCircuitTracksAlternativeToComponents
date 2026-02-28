<script setup>
import { useSequencerStore } from '@/stores/sequencer'

const props = defineProps({
  step: { type: Object, required: true },
  stepIndex: { type: Number, required: true },
  trackIndex: { type: Number, required: true },
  isPlaying: { type: Boolean, default: false }
})

const store = useSequencerStore()
</script>

<template>
  <button
    class="step-cell"
    :class="{
      'step-cell--active': step.active,
      'step-cell--playing': isPlaying,
      'step-cell--beat': stepIndex % 4 === 0
    }"
    @click="store.toggleStep(trackIndex, stepIndex)"
  />
</template>

<style scoped>
.step-cell {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
}

.step-cell--beat {
  border-color: var(--color-surface-3);
}

.step-cell:hover {
  border-color: var(--color-text-muted);
}

.step-cell--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.step-cell--playing {
  border-color: #fff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
}
</style>
