<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import StepCell from './StepCell.vue'

const props = defineProps({
  track:      { type: Object, required: true },
  trackIndex: { type: Number, required: true },
  stepCount:  { type: Number, default: 16 },
  trackColor: { type: String, default: 'var(--color-accent)' },
})

const store = useSequencerStore()
</script>

<template>
  <div class="track-row" :class="{ 'track-row--muted': track.muted }">
    <!-- Track header -->
    <div class="track-row__header" :style="{ borderLeftColor: trackColor }">
      <button
        class="track-row__mute"
        :class="{ 'track-row__mute--active': track.muted }"
        @click="store.toggleMute(trackIndex)"
        title="Mute track"
      >M</button>
      <span class="track-row__name">{{ track.name }}</span>
    </div>

    <!-- Steps (grouped in sets of 4 for visual readability) -->
    <div class="track-row__steps">
      <div
        v-for="group in Math.ceil(stepCount / 4)"
        :key="group"
        class="track-row__group"
      >
        <StepCell
          v-for="s in 4"
          :key="(group - 1) * 4 + s - 1"
          :step="track.steps[(group - 1) * 4 + s - 1]"
          :step-index="(group - 1) * 4 + s - 1"
          :track-index="trackIndex"
          :track-color="trackColor"
          :is-playing="store.playingStep === (group - 1) * 4 + s - 1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: opacity var(--transition-fast);
}

.track-row--muted { opacity: 0.35; }

.track-row__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 104px;
  flex-shrink: 0;
  border-left: 3px solid transparent;
  padding-left: 4px;
}

.track-row__mute {
  width: 20px;
  height: 20px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.62rem;
  font-weight: 700;
  transition: all var(--transition-fast);
  padding: 0;
  flex-shrink: 0;
}

.track-row__mute--active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: #000;
}

.track-row__name {
  font-size: 0.78rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.track-row__steps {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: nowrap;
  overflow-x: auto;
}

.track-row__group {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
</style>
