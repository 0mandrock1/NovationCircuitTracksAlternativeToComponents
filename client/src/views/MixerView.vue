<script setup>
import { useMixerStore } from '@/stores/mixer'
import MixerChannel from '@/components/mixer/MixerChannel.vue'

const store = useMixerStore()
</script>

<template>
  <div class="mixer-view">
    <h2>Mixer</h2>
    <div class="mixer-view__channels">
      <MixerChannel
        v-for="(channel, index) in store.channels"
        :key="index"
        :channel="channel"
        :index="index"
      />
    </div>

    <div class="mixer-view__macros">
      <div class="mixer-view__macros-title">Macro Knobs · Synth 1 (CC 80–87 / Ch 1)</div>
      <div class="mixer-view__macros-row">
        <div
          v-for="(val, i) in store.macros"
          :key="i"
          class="mixer-view__macro"
        >
          <div class="mixer-view__macro-bar">
            <div class="mixer-view__macro-fill" :style="{ height: (val / 127 * 100) + '%' }" />
          </div>
          <span class="mixer-view__macro-label">M{{ i + 1 }}</span>
          <span class="mixer-view__macro-val">{{ val }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mixer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mixer-view__channels {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
}

.mixer-view__macros {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.mixer-view__macros-title {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.mixer-view__macros-row {
  display: flex;
  gap: var(--spacing-sm);
}

.mixer-view__macro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.mixer-view__macro-bar {
  width: 20px;
  height: 48px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.mixer-view__macro-fill {
  background: var(--color-accent);
  width: 100%;
  transition: height 0.1s;
  min-height: 2px;
}

.mixer-view__macro-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.mixer-view__macro-val {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-text-muted);
}
</style>
