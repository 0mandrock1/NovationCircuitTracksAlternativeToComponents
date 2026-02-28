<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import TrackRow from './TrackRow.vue'

const store = useSequencerStore()
</script>

<template>
  <div class="step-grid">
    <div class="step-grid__pattern-select">
      <button
        v-for="i in 8"
        :key="i"
        class="step-grid__pattern-btn"
        :class="{ 'step-grid__pattern-btn--active': store.activePatternIndex === i - 1 }"
        @click="store.activePatternIndex = i - 1"
      >
        {{ i }}
      </button>
    </div>
    <div class="step-grid__tracks">
      <TrackRow
        v-for="(track, index) in store.activePattern.tracks"
        :key="index"
        :track="track"
        :track-index="index"
        :step-count="store.activePattern.stepCount"
      />
    </div>
  </div>
</template>

<style scoped>
.step-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.step-grid__pattern-select {
  display: flex;
  gap: var(--spacing-xs);
}

.step-grid__pattern-btn {
  width: 32px;
  height: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--transition-fast);
}

.step-grid__pattern-btn:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.step-grid__pattern-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.step-grid__tracks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
