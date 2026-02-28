<script setup>
import { onMounted, ref } from 'vue'
import { useSamplesStore } from '@/stores/samples'
import SampleList from '@/components/samples/SampleList.vue'

const store = useSamplesStore()

// Global drop zone for drag-and-drop onto empty area
const dragOver = ref(false)
const dropIndex = ref(null)

function onDragoverRoot(e) {
  e.preventDefault()
  dragOver.value = true
}

function onDragleaveRoot() {
  dragOver.value = false
}

async function onDropRoot(e) {
  e.preventDefault()
  dragOver.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  const audio = files.filter(f => /\.(wav|aiff?|mp3|ogg|flac)$/i.test(f.name))
  if (!audio.length) return
  // Fill from first empty slot
  let slot = store.samples.findIndex(s => !s.hasFile)
  for (const f of audio) {
    if (slot >= 64) break
    await store.uploadSample(slot, f)
    slot = store.samples.findIndex((s, i) => i > slot && !s.hasFile)
    if (slot === -1) break
  }
}

onMounted(() => store.fetchSamples())
</script>

<template>
  <div
    class="samples-view"
    @dragover.prevent="onDragoverRoot"
    @dragleave="onDragleaveRoot"
    @drop="onDropRoot"
  >
    <div class="samples-view__header">
      <div class="samples-view__stats">
        {{ store.samples.filter(s => s.hasFile).length }} / 64 slots filled
      </div>
      <div class="samples-view__hint">
        Drag audio files onto the list or individual slots
      </div>
    </div>

    <div
      class="samples-view__body"
      :class="{ 'samples-view__body--dragover': dragOver }"
    >
      <SampleList />
    </div>
  </div>
</template>

<style scoped>
.samples-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  height: 100%;
  overflow: hidden;
}

.samples-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.samples-view__stats {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-dim);
}

.samples-view__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.samples-view__body {
  flex: 1;
  overflow-y: auto;
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-fast);
}

.samples-view__body--dragover {
  box-shadow: 0 0 0 2px var(--color-accent);
}
</style>
