<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import StepGrid from '@/components/sequencer/StepGrid.vue'

const store = useSequencerStore()

async function sendTransport(action) {
  try {
    await fetch(`/api/transport/${action}`, { method: 'POST' })
  } catch { /* no device */ }
}

function setStepCount(count) {
  store.activePattern.stepCount = count
}
</script>

<template>
  <div class="sequencer-view">
    <div class="sequencer-view__toolbar">
      <!-- Transport controls -->
      <div class="seq-transport">
        <button
          class="seq-btn seq-btn--play"
          :class="{ 'seq-btn--active': store.transportState === 'playing' || store.transportState === 'continued' }"
          title="Play (MIDI Start)"
          @click="sendTransport('play')"
        >▶</button>
        <button
          class="seq-btn"
          title="Stop (MIDI Stop)"
          @click="sendTransport('stop')"
        >■</button>
        <button
          class="seq-btn"
          title="Continue (MIDI Continue)"
          @click="sendTransport('continue')"
        >▶▶</button>
      </div>

      <div class="seq-divider" />

      <!-- Pattern selector (0–7) -->
      <div class="seq-patterns">
        <button
          v-for="i in 8"
          :key="i"
          class="seq-btn seq-btn--pat"
          :class="{ 'seq-btn--active': store.activePatternIndex === i - 1 }"
          @click="store.activePatternIndex = i - 1"
          :title="`Pattern ${i}`"
        >{{ i }}</button>
      </div>

      <div class="seq-divider" />

      <!-- Step count toggle (16 / 32) -->
      <div class="seq-steps">
        <button
          class="seq-btn"
          :class="{ 'seq-btn--active': store.activePattern.stepCount === 16 }"
          @click="setStepCount(16)"
        >16</button>
        <button
          class="seq-btn"
          :class="{ 'seq-btn--active': store.activePattern.stepCount === 32 }"
          @click="setStepCount(32)"
        >32</button>
      </div>

      <!-- Live step indicator -->
      <div
        v-if="store.transportState !== 'stopped'"
        class="seq-playing-badge"
      >
        <span class="seq-playing-dot" />
        Step {{ store.playingStep >= 0 ? store.playingStep + 1 : '—' }}
      </div>
    </div>

    <div class="sequencer-view__grid">
      <StepGrid />
    </div>
  </div>
</template>

<style scoped>
.sequencer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  height: 100%;
  overflow: hidden;
}

.sequencer-view__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.sequencer-view__grid {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  min-width: 0;
}

.seq-transport,
.seq-patterns,
.seq-steps {
  display: flex;
  gap: 2px;
}

.seq-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
  flex-shrink: 0;
}

.seq-btn {
  padding: 4px 10px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  min-width: 28px;
}
.seq-btn:hover { border-color: var(--color-text-muted); color: var(--color-text); }
.seq-btn--active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.seq-btn--play.seq-btn--active { background: var(--color-success); border-color: var(--color-success); }

.seq-playing-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-success);
  margin-left: auto;
}

.seq-playing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}
</style>
