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

// Read helpers
const p = computed(() => props.patch.params ?? {})

// ── Generic param update → rawBytes → debounced SysEx ────────────────────────
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

// Named aliases for template readability
function upd(path) {
  return (v) => update(path, v)
}

const OSC_WAVES  = ['Sine', 'Tri', 'Saw', 'Pulse']
const LFO_WAVES  = ['Sine', 'Tri', 'Saw', 'Sqr', 'S&H']
const FILT_TYPES = ['LP 12', 'LP 24', 'HP 12', 'HP 24', 'BP 12', 'BP 24']
</script>

<template>
  <div class="synth-editor" v-if="patch.params">
    <!-- ── OSC A ──────────────────────────────────────────────────────────── -->
    <section class="se-section">
      <h3 class="se-section__title">OSC A</h3>
      <div class="se-row">
        <div class="se-wave-select">
          <label class="se-label">Wave</label>
          <div class="se-wave-btns">
            <button
              v-for="(w, i) in OSC_WAVES" :key="i"
              class="se-wave-btn"
              :class="{ 'se-wave-btn--active': p.oscA?.wave === i }"
              @click="update('oscA.wave', i)"
            >{{ w }}</button>
          </div>
        </div>
        <Knob :model-value="p.oscA?.coarse ?? 64" @update:model-value="upd('oscA.coarse')" label="Coarse" />
        <Knob :model-value="p.oscA?.fine   ?? 64" @update:model-value="upd('oscA.fine')"   label="Fine" />
        <Knob :model-value="p.oscA?.pw     ?? 64" @update:model-value="upd('oscA.pw')"     label="PW" />
        <Knob :model-value="p.oscA?.mix    ?? 100"@update:model-value="upd('oscA.mix')"    label="Mix" />
        <Knob :model-value="p.oscA?.fm     ?? 0"  @update:model-value="upd('oscA.fm')"     label="FM" />
        <Knob :model-value="p.oscA?.ring   ?? 0"  @update:model-value="upd('oscA.ring')"   label="Ring" />
      </div>
    </section>

    <!-- ── OSC B ──────────────────────────────────────────────────────────── -->
    <section class="se-section">
      <h3 class="se-section__title">OSC B</h3>
      <div class="se-row">
        <div class="se-wave-select">
          <label class="se-label">Wave</label>
          <div class="se-wave-btns">
            <button
              v-for="(w, i) in OSC_WAVES" :key="i"
              class="se-wave-btn"
              :class="{ 'se-wave-btn--active': p.oscB?.wave === i }"
              @click="update('oscB.wave', i)"
            >{{ w }}</button>
          </div>
        </div>
        <Knob :model-value="p.oscB?.coarse ?? 64" @update:model-value="upd('oscB.coarse')" label="Coarse" />
        <Knob :model-value="p.oscB?.fine   ?? 64" @update:model-value="upd('oscB.fine')"   label="Fine" />
        <Knob :model-value="p.oscB?.pw     ?? 64" @update:model-value="upd('oscB.pw')"     label="PW" />
        <Knob :model-value="p.oscB?.mix    ?? 0"  @update:model-value="upd('oscB.mix')"    label="Mix" />
        <Knob :model-value="p.oscB?.drift  ?? 0"  @update:model-value="upd('oscB.drift')"  label="Drift" />
      </div>
    </section>

    <!-- ── Filter ─────────────────────────────────────────────────────────── -->
    <section class="se-section">
      <h3 class="se-section__title">Filter</h3>
      <div class="se-row">
        <div class="se-wave-select">
          <label class="se-label">Type</label>
          <div class="se-wave-btns">
            <button
              v-for="(t, i) in FILT_TYPES" :key="i"
              class="se-wave-btn"
              :class="{ 'se-wave-btn--active': p.filter?.type === i }"
              @click="update('filter.type', i)"
            >{{ t }}</button>
          </div>
        </div>
        <Knob :model-value="p.filter?.cutoff    ?? 100" @update:model-value="upd('filter.cutoff')"    label="Cutoff"   color="var(--color-info)" />
        <Knob :model-value="p.filter?.resonance ?? 0"   @update:model-value="upd('filter.resonance')" label="Res"      color="var(--color-info)" />
        <Knob :model-value="p.filter?.drive     ?? 0"   @update:model-value="upd('filter.drive')"     label="Drive"    color="var(--color-info)" />
        <Knob :model-value="p.filter?.envAmt    ?? 0"   @update:model-value="upd('filter.envAmt')"    label="Env Amt"  color="var(--color-info)" />
        <Knob :model-value="p.filter?.velocity  ?? 0"   @update:model-value="upd('filter.velocity')"  label="Vel"      color="var(--color-info)" />
      </div>
    </section>

    <!-- ── Envelopes ──────────────────────────────────────────────────────── -->
    <div class="se-envs">
      <section class="se-section">
        <h3 class="se-section__title">Filter Env</h3>
        <div class="se-row">
          <Knob :model-value="p.filterEnv?.a ?? 0"   @update:model-value="upd('filterEnv.a')" label="A" color="var(--color-info)" />
          <Knob :model-value="p.filterEnv?.d ?? 60"  @update:model-value="upd('filterEnv.d')" label="D" color="var(--color-info)" />
          <Knob :model-value="p.filterEnv?.s ?? 80"  @update:model-value="upd('filterEnv.s')" label="S" color="var(--color-info)" />
          <Knob :model-value="p.filterEnv?.r ?? 40"  @update:model-value="upd('filterEnv.r')" label="R" color="var(--color-info)" />
        </div>
      </section>

      <section class="se-section">
        <h3 class="se-section__title">Amp Env</h3>
        <div class="se-row">
          <Knob :model-value="p.ampEnv?.a ?? 0"   @update:model-value="upd('ampEnv.a')" label="A" color="var(--color-success)" />
          <Knob :model-value="p.ampEnv?.d ?? 30"  @update:model-value="upd('ampEnv.d')" label="D" color="var(--color-success)" />
          <Knob :model-value="p.ampEnv?.s ?? 100" @update:model-value="upd('ampEnv.s')" label="S" color="var(--color-success)" />
          <Knob :model-value="p.ampEnv?.r ?? 30"  @update:model-value="upd('ampEnv.r')" label="R" color="var(--color-success)" />
        </div>
      </section>

      <section class="se-section">
        <h3 class="se-section__title">Amp</h3>
        <div class="se-row">
          <Knob :model-value="p.amp?.level    ?? 100" @update:model-value="upd('amp.level')"    label="Level"    color="var(--color-success)" />
          <Knob :model-value="p.amp?.pan      ?? 64"  @update:model-value="upd('amp.pan')"      label="Pan"      color="var(--color-success)" />
          <Knob :model-value="p.amp?.velocity ?? 0"   @update:model-value="upd('amp.velocity')" label="Vel"      color="var(--color-success)" />
        </div>
      </section>
    </div>

    <!-- ── LFO 1 ──────────────────────────────────────────────────────────── -->
    <section class="se-section">
      <h3 class="se-section__title">LFO 1</h3>
      <div class="se-row">
        <div class="se-wave-select">
          <label class="se-label">Wave</label>
          <div class="se-wave-btns">
            <button
              v-for="(w, i) in LFO_WAVES" :key="i"
              class="se-wave-btn"
              :class="{ 'se-wave-btn--active': p.lfo1?.wave === i }"
              @click="update('lfo1.wave', i)"
            >{{ w }}</button>
          </div>
        </div>
        <Knob :model-value="p.lfo1?.rate  ?? 64" @update:model-value="upd('lfo1.rate')"  label="Rate"  color="var(--color-warning)" />
        <Knob :model-value="p.lfo1?.depth ?? 0"  @update:model-value="upd('lfo1.depth')" label="Depth" color="var(--color-warning)" />
        <Knob :model-value="p.lfo1?.delay ?? 0"  @update:model-value="upd('lfo1.delay')" label="Delay" color="var(--color-warning)" />
        <Knob :model-value="p.lfo1?.fade  ?? 0"  @update:model-value="upd('lfo1.fade')"  label="Fade"  color="var(--color-warning)" />
        <div class="se-toggle-col">
          <label class="se-label">Sync</label>
          <Toggle :model-value="!!p.lfo1?.sync" @update:model-value="v => update('lfo1.sync', v ? 1 : 0)" />
        </div>
      </div>
    </section>

    <!-- ── LFO 2 ──────────────────────────────────────────────────────────── -->
    <section class="se-section">
      <h3 class="se-section__title">LFO 2</h3>
      <div class="se-row">
        <div class="se-wave-select">
          <label class="se-label">Wave</label>
          <div class="se-wave-btns">
            <button
              v-for="(w, i) in LFO_WAVES" :key="i"
              class="se-wave-btn"
              :class="{ 'se-wave-btn--active': p.lfo2?.wave === i }"
              @click="update('lfo2.wave', i)"
            >{{ w }}</button>
          </div>
        </div>
        <Knob :model-value="p.lfo2?.rate  ?? 64" @update:model-value="upd('lfo2.rate')"  label="Rate"  color="var(--color-warning)" />
        <Knob :model-value="p.lfo2?.depth ?? 0"  @update:model-value="upd('lfo2.depth')" label="Depth" color="var(--color-warning)" />
        <Knob :model-value="p.lfo2?.delay ?? 0"  @update:model-value="upd('lfo2.delay')" label="Delay" color="var(--color-warning)" />
        <Knob :model-value="p.lfo2?.fade  ?? 0"  @update:model-value="upd('lfo2.fade')"  label="Fade"  color="var(--color-warning)" />
        <div class="se-toggle-col">
          <label class="se-label">Sync</label>
          <Toggle :model-value="!!p.lfo2?.sync" @update:model-value="v => update('lfo2.sync', v ? 1 : 0)" />
        </div>
      </div>
    </section>

    <!-- ── FX Sends ───────────────────────────────────────────────────────── -->
    <section class="se-section">
      <h3 class="se-section__title">FX Sends</h3>
      <div class="se-row">
        <Knob :model-value="p.reverbSend ?? 0" @update:model-value="upd('reverbSend')" label="Reverb" />
        <Knob :model-value="p.delaySend  ?? 0" @update:model-value="upd('delaySend')"  label="Delay"  />
      </div>
    </section>
  </div>

  <div v-else class="se-no-data">
    No patch data loaded. Fetch from device or import a .syx file.
  </div>
</template>

<style scoped>
.synth-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-lg);
}

.se-no-data {
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.se-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.se-section__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.se-row {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.se-envs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.se-wave-select {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.se-label {
  font-size: 0.62rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.se-wave-btns {
  display: flex;
  gap: 2px;
}

.se-wave-btn {
  padding: 2px 7px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.65rem;
  transition: all var(--transition-fast);
}

.se-wave-btn:hover { color: var(--color-text); border-color: var(--color-text-muted); }

.se-wave-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.se-toggle-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
</style>
