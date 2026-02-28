<script setup>
import { computed } from 'vue'
import { usePatchesStore } from '@/stores/patches'
import Knob   from '@/components/ui/Knob.vue'
import Toggle from '@/components/ui/Toggle.vue'

const props = defineProps({
  patch:      { type: Object, required: true },
  patchIndex: { type: Number, required: true },
})

const store = usePatchesStore()
const p = computed(() => props.patch.params ?? {})

// Circuit Tracks delay presets (16 slots)
const DELAY_PRESETS = [
  '1/32', '1/16T', '1/16', '1/8T', '1/8', '1/4T', '1/4', '3/8',
  '1/2', '3/4', '1/1', '1.5', '2/1', '3/1', '4/1', 'Tape',
]

// Circuit Tracks reverb presets (8 slots)
const REVERB_PRESETS = [
  'Room 1', 'Room 2', 'Hall 1', 'Hall 2',
  'Cave', 'Plate', 'Spring', 'Shimmer',
]

function update(path, value) {
  const parts = path.split('.')
  let obj = props.patch.params
  if (!obj) return
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]]
  if (!obj) return
  obj[parts[parts.length - 1]] = value
  store.sendToDevice(props.patchIndex)
}
</script>

<template>
  <div class="effects-editor" v-if="patch.params">
    <!-- Distortion -->
    <section class="ee-section">
      <div class="ee-section__header">
        <h3 class="ee-section__title">Distortion</h3>
        <Toggle
          :model-value="!!p.distortion?.enable"
          @update:model-value="v => update('distortion.enable', v ? 1 : 0)"
          label="Enable"
        />
      </div>
      <div class="ee-row">
        <Knob
          :model-value="p.distortion?.amount ?? 0"
          @update:model-value="v => update('distortion.amount', v)"
          label="Amount"
          :size="52"
          color="var(--color-accent)"
        />
      </div>
    </section>

    <!-- Chorus -->
    <section class="ee-section">
      <div class="ee-section__header">
        <h3 class="ee-section__title">Chorus</h3>
        <Toggle
          :model-value="!!p.chorus?.enable"
          @update:model-value="v => update('chorus.enable', v ? 1 : 0)"
          label="Enable"
        />
      </div>
      <div class="ee-row">
        <Knob :model-value="p.chorus?.rate     ?? 64" @update:model-value="v => update('chorus.rate',     v)" label="Rate"     :size="52" color="var(--color-info)" />
        <Knob :model-value="p.chorus?.depth    ?? 64" @update:model-value="v => update('chorus.depth',    v)" label="Depth"    :size="52" color="var(--color-info)" />
        <Knob :model-value="p.chorus?.feedback ?? 0"  @update:model-value="v => update('chorus.feedback', v)" label="Feedback" :size="52" color="var(--color-info)" />
        <Knob :model-value="p.chorus?.mix      ?? 64" @update:model-value="v => update('chorus.mix',      v)" label="Mix"      :size="52" color="var(--color-info)" />
      </div>
    </section>

    <!-- Delay preset -->
    <section class="ee-section">
      <h3 class="ee-section__title">Delay Preset</h3>
      <div class="ee-presets">
        <button
          v-for="(name, i) in DELAY_PRESETS" :key="i"
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': (p.delayPreset ?? 0) === i }"
          @click="update('delayPreset', i)"
        >{{ name }}</button>
      </div>
    </section>

    <!-- Reverb preset -->
    <section class="ee-section">
      <h3 class="ee-section__title">Reverb Preset</h3>
      <div class="ee-presets">
        <button
          v-for="(name, i) in REVERB_PRESETS" :key="i"
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': (p.reverbPreset ?? 0) === i }"
          @click="update('reverbPreset', i)"
        >{{ name }}</button>
      </div>
    </section>

    <!-- FX Sends -->
    <section class="ee-section">
      <h3 class="ee-section__title">FX Sends</h3>
      <div class="ee-row">
        <Knob :model-value="p.reverbSend ?? 0" @update:model-value="v => update('reverbSend', v)" label="Reverb Send" :size="52" color="var(--color-accent)" />
        <Knob :model-value="p.delaySend  ?? 0" @update:model-value="v => update('delaySend',  v)" label="Delay Send"  :size="52" color="var(--color-accent)" />
      </div>
    </section>
  </div>
  <div v-else class="ee-no-data">No patch data loaded.</div>
</template>

<style scoped>
.effects-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-lg);
}

.ee-no-data { padding: var(--spacing-lg); color: var(--color-text-muted); font-size: 0.9rem; }

.ee-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.ee-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.ee-section__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.ee-row {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.ee-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 2px;
}

.ee-preset-btn {
  padding: 3px 10px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.72rem;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.ee-preset-btn:hover { color: var(--color-text); border-color: var(--color-text-muted); }

.ee-preset-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}
</style>
