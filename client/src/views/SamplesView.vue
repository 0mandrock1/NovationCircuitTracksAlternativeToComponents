<script setup>
import { ref, onMounted } from 'vue'
import { useSamplesStore } from '@/stores/samples'
import SampleList from '@/components/samples/SampleList.vue'

const store = useSamplesStore()
const dragOverZone = ref(false)

onMounted(() => store.fetchSamples())

function onZoneDrop(e) {
  dragOverZone.value = false
  const files = Array.from(e.dataTransfer.files).filter(f =>
    /\.(wav|aiff?|mp3)$/i.test(f.name)
  )
  files.forEach((file, i) => {
    const slot = store.samples.findIndex(s => !s.filename)
    if (slot !== -1) store.uploadSample(slot, file)
  })
}
</script>

<template>
  <div class="samples-view">
    <div class="samples-view__header">
      <h2>Samples</h2>
      <div class="samples-view__hint">
        Drag &amp; drop audio files onto a slot, or use the ↑ button to replace
      </div>
    </div>

    <div
      class="samples-view__drop-zone"
      :class="{ 'samples-view__drop-zone--active': dragOverZone }"
      @dragover.prevent="dragOverZone = true"
      @dragleave="dragOverZone = false"
      @drop.prevent="onZoneDrop"
    >
      <SampleList />
      <div v-if="dragOverZone" class="samples-view__drop-overlay">
        Drop to fill empty slots
      </div>
    </div>
  </div>
</template>

<style scoped>
.samples-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.samples-view__header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
}

.samples-view__hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.samples-view__drop-zone {
  position: relative;
  border-radius: var(--radius-md);
  transition: outline var(--transition-fast);
}

.samples-view__drop-zone--active {
  outline: 2px dashed var(--color-accent);
  outline-offset: 4px;
}

.samples-view__drop-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--color-accent);
  pointer-events: none;
  border-radius: var(--radius-md);
}
</style>
