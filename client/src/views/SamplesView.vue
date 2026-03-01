<script setup>
import { computed } from 'vue'
import { useSamplesStore } from '@/stores/samples'
import { useDeviceStore }  from '@/stores/device'
import SampleList from '@/components/samples/SampleList.vue'

const store  = useSamplesStore()
const device = useDeviceStore()

const activeProgress = computed(() =>
  store.fetchingAll ? store.fetchProgress : store.sendProgress
)
const inProgress = computed(() => store.fetchingAll || store.sendingAll)

function onZoneDrop(e) {
  const files = Array.from(e.dataTransfer.files).filter(f =>
    /\.(wav|aiff?|mp3)$/i.test(f.name)
  )
  files.forEach(file => {
    const slot = store.samples.findIndex(s => !s.filename)
    if (slot !== -1) store.loadFile(slot, file)
  })
}
</script>

<template>
  <div class="samples-view">
    <div class="samples-view__toolbar">
      <h2 class="samples-view__title">Samples</h2>

      <div class="samples-view__actions">
        <!-- Fetch all from device -->
        <template v-if="!store.fetchingAll">
          <button
            class="btn btn--sm"
            :disabled="!device.connected || store.sendingAll"
            :title="device.connected ? 'Fetch all sample names from device' : 'Connect device first'"
            @click="store.fetchAllFromDevice()"
          >↓ Fetch All</button>
        </template>
        <template v-else>
          <button class="btn btn--sm btn--active" disabled>↓ {{ store.fetchProgress.done }}/64</button>
          <button class="btn btn--sm" @click="store.cancelFetchAll()">✕</button>
        </template>

        <!-- Send all to device -->
        <template v-if="!store.sendingAll">
          <button
            class="btn btn--sm"
            :disabled="!device.connected || store.fetchingAll"
            :title="device.connected ? 'Send all loaded samples to device' : 'Connect device first'"
            @click="store.sendAllToDevice()"
          >↑ Send All</button>
        </template>
        <template v-else>
          <button class="btn btn--sm btn--active" disabled>↑ {{ store.sendProgress.done }}/64</button>
          <button class="btn btn--sm" @click="store.cancelSendAll()">✕</button>
        </template>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="inProgress" class="samples-view__progress">
      <div
        class="samples-view__progress-fill"
        :style="{ width: (activeProgress.done / activeProgress.total * 100) + '%' }"
      />
      <span class="samples-view__progress-label">
        {{ store.fetchingAll ? '↓ Fetch' : '↑ Send' }}
        {{ activeProgress.done }} / {{ activeProgress.total }}
        <span v-if="activeProgress.failed" class="samples-view__progress-failed">
          ({{ activeProgress.failed }} failed)
        </span>
      </span>
    </div>

    <div class="samples-view__hint">
      Drag &amp; drop audio files to load locally · device operations require server connection
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
  flex-wrap: wrap;
}

.samples-view__title {
  font-size: 1.1rem;
  margin: 0;
}

.samples-view__actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.samples-view__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.samples-view__drop-zone {
  border-radius: var(--radius-md);
}

/* Progress bar */
.samples-view__progress {
  position: relative;
  height: 18px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
}

.samples-view__progress-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--color-accent);
  opacity: 0.35;
  transition: width 0.15s ease;
}

.samples-view__progress-label {
  position: relative;
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  padding: 0 8px;
  z-index: 1;
}

.samples-view__progress-failed { color: var(--color-warning); }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  transition: all var(--transition-fast);
}
.btn:hover:not(:disabled) { border-color: var(--color-text-muted); }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn--sm { font-size: 0.72rem; }
.btn--active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; opacity: 1; }
</style>
