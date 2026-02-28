<script setup>
import { computed } from 'vue'
import { usePatchesStore } from '@/stores/patches'
import Knob from '@/components/ui/Knob.vue'

const props = defineProps({
  patch:      { type: Object, required: true },
  patchIndex: { type: Number, required: true },
})

const store = usePatchesStore()
const p = computed(() => props.patch.params ?? {})

function updateMacro(index, value) {
  if (!props.patch.params?.macros) return
  props.patch.params.macros[index] = value
  store.sendToDevice(props.patchIndex)
}
</script>

<template>
  <div class="macro-editor" v-if="patch.params">
    <section class="me-section">
      <h3 class="me-section__title">Macro Knobs</h3>
      <div class="me-macros">
        <div
          v-for="(val, i) in (p.macros ?? Array(8).fill(0))"
          :key="i"
          class="me-macro"
        >
          <Knob
            :model-value="val"
            @update:model-value="v => updateMacro(i, v)"
            :label="`M${i + 1}`"
            :size="56"
            color="var(--color-warning)"
          />
        </div>
      </div>
    </section>
  </div>
  <div v-else class="me-no-data">No patch data loaded.</div>
</template>

<style scoped>
.macro-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-lg);
}

.me-no-data { padding: var(--spacing-lg); color: var(--color-text-muted); font-size: 0.9rem; }

.me-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.me-section__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.me-macros {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.me-macro {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
