<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import StepCell from './StepCell.vue'

const props = defineProps({
  track: { type: Object, required: true },
  trackIndex: { type: Number, required: true },
  stepCount: { type: Number, default: 16 }
})

const store = useSequencerStore()
</script>

<template>
  <div class="track-row" :class="{ 'track-row--muted': track.muted }">
    <div class="track-row__header">
      <button
        class="track-row__mute"
        :class="{ 'track-row__mute--active': track.muted }"
        @click="store.toggleMute(trackIndex)"
        title="Mute"
      >
        M
      </button>
      <span class="track-row__name">{{ track.name }}</span>
    </div>
    <div class="track-row__steps">
      <StepCell
        v-for="stepIndex in stepCount"
        :key="stepIndex - 1"
        :step="track.steps[stepIndex - 1]"
        :step-index="stepIndex - 1"
        :track-index="trackIndex"
        :is-playing="store.playingStep === stepIndex - 1"
      />
    </div>
  </div>
</template>

<style scoped>
.track-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.track-row--muted {
  opacity: 0.4;
}

.track-row__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100px;
  flex-shrink: 0;
}

.track-row__mute {
  width: 20px;
  height: 20px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.track-row__mute--active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: #000;
}

.track-row__name {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-row__steps {
  display: flex;
  gap: 2px;
  flex: 1;
}
</style>
