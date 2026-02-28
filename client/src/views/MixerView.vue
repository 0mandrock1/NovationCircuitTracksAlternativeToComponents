<script setup>
import { computed } from 'vue'
import { useMixerStore } from '@/stores/mixer'
import MixerChannel from '@/components/mixer/MixerChannel.vue'
import Knob from '@/components/ui/Knob.vue'

const store = useMixerStore()

const TRACK_COLORS = [
  'var(--color-synth1)', 'var(--color-synth2)',
  'var(--color-midi1)',  'var(--color-midi2)',
  'var(--color-midi3)',  'var(--color-midi4)',
  'var(--color-drum1)',  'var(--color-drum2)',
]

const MACRO_LABELS = ['M1','M2','M3','M4','M5','M6','M7','M8']

// Compute "all muted" for quick info
const mutedCount = computed(() => store.channels.filter(c => c.muted).length)
</script>

<template>
  <div class="mixer-view">
    <!-- Channel strips -->
    <div class="mixer-view__channels-wrap">
      <div class="mixer-view__channels">
        <MixerChannel
          v-for="(ch, i) in store.channels"
          :key="i"
          :channel="ch"
          :index="i"
          :track-color="TRACK_COLORS[i] ?? 'var(--color-accent)'"
        />
      </div>
    </div>

    <!-- Macro display (read-only — reflects device macro knobs) -->
    <div class="mixer-view__macros">
      <div class="mixer-view__macros-title">Macros</div>
      <div class="mixer-view__macros-row">
        <div v-for="(val, i) in store.macros" :key="i" class="mixer-view__macro">
          <Knob
            :model-value="val"
            @update:model-value="store.updateMacro(i, $event)"
            :label="MACRO_LABELS[i]"
            :size="44"
            color="var(--color-warning)"
          />
        </div>
      </div>
    </div>

    <!-- Quick status bar -->
    <div class="mixer-view__status" v-if="mutedCount > 0">
      {{ mutedCount }} track{{ mutedCount > 1 ? 's' : '' }} muted
    </div>
  </div>
</template>

<style scoped>
.mixer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
}

.mixer-view__channels-wrap {
  overflow-x: auto;
  flex-shrink: 0;
}

.mixer-view__channels {
  display: flex;
  gap: var(--spacing-sm);
  min-width: max-content;
}

.mixer-view__macros {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  flex-shrink: 0;
}

.mixer-view__macros-title {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.mixer-view__macros-row {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.mixer-view__macro {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mixer-view__status {
  font-size: 0.78rem;
  color: var(--color-warning);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  align-self: flex-start;
}
</style>
