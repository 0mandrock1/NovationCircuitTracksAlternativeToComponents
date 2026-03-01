<script setup>
import { useSamplesStore } from '@/stores/samples'
import SampleList from '@/components/samples/SampleList.vue'

const store = useSamplesStore()

function onZoneDrop(e) {
  const files = Array.from(e.dataTransfer.files).filter(f =>
    /\.(wav|aiff?|mp3)$/i.test(f.name)
  )
  files.forEach(async file => {
    const slot = store.samples.findIndex(s => !s.filename)
    if (slot !== -1) {
      await store.loadFile(slot, file)
      const formData = new FormData()
      formData.append('file', file)
      fetch(`/api/samples/${slot}/upload`, { method: 'POST', body: formData }).catch(() => {})
    }
  })
}
</script>

<template>
  <div class="samples-view">
    <div class="samples-view__toolbar">
      <h2 class="samples-view__title">Samples</h2>
    </div>

    <div class="samples-view__hint">
      Загрузи WAV/MP3 локально — превью работает сразу.
      Загрузка на физическое устройство через MIDI недоступна — используй SD-карту.
    </div>

    <div
      class="samples-view__drop-zone"
      @dragover.prevent
      @drop.prevent="onZoneDrop"
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
}

.samples-view__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.samples-view__title {
  font-size: 1.1rem;
  margin: 0;
}

.samples-view__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.samples-view__drop-zone {
  border-radius: var(--radius-md);
}
</style>
