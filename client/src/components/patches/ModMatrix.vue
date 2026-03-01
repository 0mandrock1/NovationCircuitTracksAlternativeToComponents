<script setup>
import { computed } from 'vue'
import { usePatchesStore } from '@/stores/patches'

const props = defineProps({
  patch:      { type: Object, required: true },
  patchIndex: { type: Number, required: true },
})

const store = usePatchesStore()
const p = computed(() => props.patch.params ?? {})

const MOD_SOURCES = [
  'LFO 1', 'LFO 2', 'Env 1', 'Env 2', 'Env 3',
  'Macro 1', 'Macro 2', 'Macro 3', 'Macro 4',
  'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8',
]

const MOD_DESTINATIONS = [
  'OSC A Pitch', 'OSC A Wave', 'OSC A PW', 'OSC A FM',
  'OSC B Pitch', 'OSC B Wave', 'OSC B PW', 'OSC Mix', 'Sub Level',
  'Filter Cutoff', 'Filter Res', 'Filter Drive', 'Filter Env Depth',
  'LFO 1 Rate', 'LFO 1 Depth', 'LFO 2 Rate', 'LFO 2 Depth',
  'Amp Level', 'Amp Pan', 'Reverb Send', 'Delay Send',
]

const slots = computed(() =>
  p.value.modMatrix ?? Array.from({ length: 20 }, () => ({ source: 0, destination: 0, depth: 64 }))
)

function updateSlot(index, field, value) {
  if (!props.patch.params?.modMatrix) return
  props.patch.params.modMatrix[index][field] = Number(value)
  store.updateParam({ modMatrix: props.patch.params.modMatrix })
}
</script>

<template>
  <div class="mod-matrix" v-if="patch.params">
    <section class="mm-section">
      <h3 class="mm-section__title">Modulation Matrix — 20 slots</h3>

      <div class="mm-header">
        <span class="mm-col mm-col--num">#</span>
        <span class="mm-col mm-col--src">Source</span>
        <span class="mm-col mm-col--dst">Destination</span>
        <span class="mm-col mm-col--depth">Depth</span>
      </div>

      <div
        v-for="(slot, i) in slots"
        :key="i"
        class="mm-row"
      >
        <span class="mm-col mm-col--num">{{ i + 1 }}</span>

        <select
          class="mm-col mm-col--src mm-select"
          :value="slot.source"
          @change="updateSlot(i, 'source', $event.target.value)"
        >
          <option v-for="(name, idx) in MOD_SOURCES" :key="idx" :value="idx">{{ name }}</option>
        </select>

        <select
          class="mm-col mm-col--dst mm-select"
          :value="slot.destination"
          @change="updateSlot(i, 'destination', $event.target.value)"
        >
          <option v-for="(name, idx) in MOD_DESTINATIONS" :key="idx" :value="idx">{{ name }}</option>
        </select>

        <div class="mm-col mm-col--depth mm-depth">
          <input
            type="range"
            min="0" max="127"
            :value="slot.depth"
            class="mm-depth-slider"
            @input="updateSlot(i, 'depth', $event.target.value)"
          />
          <span class="mm-depth-val">{{ slot.depth }}</span>
        </div>
      </div>
    </section>
  </div>
  <div v-else class="mm-no-data">No patch data loaded.</div>
</template>

<style scoped>
.mod-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-lg);
}

.mm-no-data { padding: var(--spacing-lg); color: var(--color-text-muted); font-size: 0.9rem; }

.mm-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.mm-section__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.mm-header, .mm-row {
  display: grid;
  grid-template-columns: 28px 1fr 1fr 160px;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 3px var(--spacing-md);
}

.mm-header {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-xs);
}

.mm-row {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.mm-row:last-child { border-bottom: none; }
.mm-row:hover { background: var(--color-surface-2); }

.mm-col--num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: right;
}

.mm-select {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.8rem;
  padding: 2px var(--spacing-xs);
  cursor: pointer;
  width: 100%;
}

.mm-depth {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.mm-depth-slider {
  flex: 1;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.mm-depth-val {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-muted);
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}
</style>
