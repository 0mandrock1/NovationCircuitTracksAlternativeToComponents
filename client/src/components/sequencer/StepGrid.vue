<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import TrackRow from './TrackRow.vue'

const store = useSequencerStore()

function setStepCount(n) {
  store.activePattern.stepCount = n
}
</script>

<template>
  <div class="step-grid">
    <div class="step-grid__toolbar">
      <div class="step-grid__pattern-select">
        <span class="step-grid__label">Pattern</span>
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

      <div class="step-grid__steps-select">
        <span class="step-grid__label">Steps</span>
        <button
          class="step-grid__steps-btn"
          :class="{ 'step-grid__steps-btn--active': store.activePattern.stepCount === 16 }"
          @click="setStepCount(16)"
        >16</button>
        <button
          class="step-grid__steps-btn"
          :class="{ 'step-grid__steps-btn--active': store.activePattern.stepCount === 32 }"
          @click="setStepCount(32)"
        >32</button>
      </div>

      <div class="step-grid__hint">Right-click a step to edit parameters</div>
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

.step-grid__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.step-grid__label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.step-grid__pattern-select,
.step-grid__steps-select {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.step-grid__pattern-btn,
.step-grid__steps-btn {
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

.step-grid__steps-btn {
  width: 40px;
}

.step-grid__pattern-btn:hover,
.step-grid__steps-btn:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.step-grid__pattern-btn--active,
.step-grid__steps-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.step-grid__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: auto;
}

.step-grid__tracks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: auto;
}
</style>
