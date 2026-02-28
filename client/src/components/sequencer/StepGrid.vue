<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import TrackRow from './TrackRow.vue'

const store = useSequencerStore()

// Track colours matching Circuit Tracks pad colours
const TRACK_COLORS = [
  'var(--color-synth1)',  // Synth 1
  'var(--color-synth2)',  // Synth 2
  'var(--color-midi1)',   // MIDI 1
  'var(--color-midi2)',   // MIDI 2
  'var(--color-midi3)',   // MIDI 3
  'var(--color-midi4)',   // MIDI 4
  'var(--color-drum1)',   // Drum 1
  'var(--color-drum2)',   // Drum 2
  '#9090c0',              // Drum 3
  '#7070a0',              // Drum 4
]

function setStepCount(n) {
  store.activePattern.stepCount = n
}
</script>

<template>
  <div class="step-grid">
    <!-- Toolbar: pattern select + step count -->
    <div class="step-grid__toolbar">
      <div class="step-grid__pattern-select">
        <span class="step-grid__label">Pattern</span>
        <button
          v-for="i in 8"
          :key="i"
          class="step-grid__pat-btn"
          :class="{ 'step-grid__pat-btn--active': store.activePatternIndex === i - 1 }"
          @click="store.activePatternIndex = i - 1"
        >{{ i }}</button>
      </div>

      <div class="step-grid__step-count">
        <span class="step-grid__label">Steps</span>
        <button
          v-for="n in [16, 32]"
          :key="n"
          class="step-grid__count-btn"
          :class="{ 'step-grid__count-btn--active': store.activePattern.stepCount === n }"
          @click="setStepCount(n)"
        >{{ n }}</button>
      </div>

      <div class="step-grid__playing-indicator" v-if="store.playingStep >= 0">
        Step {{ store.playingStep + 1 }}
      </div>
    </div>

    <!-- Step number ruler -->
    <div class="step-grid__ruler">
      <div class="step-grid__ruler-offset" />
      <div
        v-for="i in store.activePattern.stepCount"
        :key="i"
        class="step-grid__ruler-num"
        :class="{ 'step-grid__ruler-num--beat': (i - 1) % 4 === 0 }"
      >{{ (i - 1) % 4 === 0 ? i : '' }}</div>
    </div>

    <!-- Tracks -->
    <div class="step-grid__tracks">
      <TrackRow
        v-for="(track, index) in store.activePattern.tracks"
        :key="index"
        :track="track"
        :track-index="index"
        :step-count="store.activePattern.stepCount"
        :track-color="TRACK_COLORS[index] ?? 'var(--color-accent)'"
      />
    </div>
  </div>
</template>

<style scoped>
.step-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-grid__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xs);
}

.step-grid__label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-right: 4px;
}

.step-grid__pattern-select,
.step-grid__step-count {
  display: flex;
  align-items: center;
  gap: 2px;
}

.step-grid__pat-btn,
.step-grid__count-btn {
  width: 28px;
  height: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.78rem;
  transition: all var(--transition-fast);
}

.step-grid__pat-btn:hover,
.step-grid__count-btn:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.step-grid__pat-btn--active,
.step-grid__count-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.step-grid__count-btn { width: 36px; }

.step-grid__playing-indicator {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-success);
  margin-left: auto;
}

/* Step number ruler */
.step-grid__ruler {
  display: flex;
  gap: 0;
  padding-left: 0;
  margin-left: 113px;  /* align with steps (header width = 104px + gap 8px + 1px) */
}

.step-grid__ruler-offset { width: 0; }

.step-grid__ruler-num {
  width: 30px;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  color: var(--color-text-muted);
  text-align: left;
  flex-shrink: 0;
}

.step-grid__ruler-num--beat { color: var(--color-text-dim); }

.step-grid__tracks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
