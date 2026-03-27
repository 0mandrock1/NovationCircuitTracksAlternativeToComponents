<script setup>
import { ref, computed } from 'vue'
import { usePatchesStore } from '@/stores/patches'
import { sendNRPN } from '@/composables/useMidi.js'
import { CH_SYNTH1, CH_SYNTH2, NRPN_DISTORTION_TYPE, NRPN_CHORUS_TYPE, DISTORTION_TYPES } from '@/midi/constants.js'
import Knob   from '@/components/ui/Knob.vue'
import Toggle from '@/components/ui/Toggle.vue'

const props = defineProps({
  patch:      { type: Object, required: true },
  patchIndex: { type: Number, required: true },
})

const store = usePatchesStore()
const p = computed(() => props.patch.params ?? {})

const synthChannel = computed(() => store.activeTrack === 0 ? CH_SYNTH1 : CH_SYNTH2)

// Local visual-only state for presets (not in SysEx patch data)
const selectedDelayPreset  = ref(0)
const selectedReverbPreset = ref(0)

// NRPN-driven effect type state
const selectedDistortionType = ref(0)
const selectedChorusType     = ref(0)  // 0=Phaser, 1=Chorus

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

  const topKey = parts[0]
  const topVal = parts.length > 1 ? props.patch.params[topKey] : value
  store.updateParam({ [topKey]: topVal })
}

function setDistortionType(i) {
  selectedDistortionType.value = i
  sendNRPN(synthChannel.value, NRPN_DISTORTION_TYPE.msb, NRPN_DISTORTION_TYPE.lsb, i)
}

function setChorusType(type) {
  selectedChorusType.value = type
  sendNRPN(synthChannel.value, NRPN_CHORUS_TYPE.msb, NRPN_CHORUS_TYPE.lsb, type)
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
      <div class="ee-type-label">Type</div>
      <div class="ee-presets">
        <button
          v-for="(name, i) in DISTORTION_TYPES" :key="i"
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': selectedDistortionType === i }"
          @click="setDistortionType(i)"
        >{{ name }}</button>
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
      <div class="ee-type-label">Type</div>
      <div class="ee-presets">
        <button
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': selectedChorusType === 0 }"
          @click="setChorusType(0)"
        >Phaser</button>
        <button
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': selectedChorusType === 1 }"
          @click="setChorusType(1)"
        >Chorus</button>
      </div>
    </section>

    <!-- Delay preset (display only — preset algorithm not remotely controllable) -->
    <section class="ee-section">
      <div class="ee-section__header">
        <h3 class="ee-section__title">Delay Preset</h3>
        <span class="ee-display-only" title="Preset selection is display-only — not remotely controllable on Circuit Tracks">Display only</span>
      </div>
      <div class="ee-presets">
        <button
          v-for="(name, i) in DELAY_PRESETS" :key="i"
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': selectedDelayPreset === i }"
          @click="selectedDelayPreset = i"
        >{{ name }}</button>
      </div>
    </section>

    <!-- Reverb preset (display only) -->
    <section class="ee-section">
      <div class="ee-section__header">
        <h3 class="ee-section__title">Reverb Preset</h3>
        <span class="ee-display-only" title="Preset selection is display-only — not remotely controllable on Circuit Tracks">Display only</span>
      </div>
      <div class="ee-presets">
        <button
          v-for="(name, i) in REVERB_PRESETS" :key="i"
          class="ee-preset-btn"
          :class="{ 'ee-preset-btn--active': selectedReverbPreset === i }"
          @click="selectedReverbPreset = i"
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

.ee-display-only {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  opacity: 0.6;
  cursor: help;
  font-style: italic;
}

.ee-type-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: var(--spacing-sm) 0 4px;
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
