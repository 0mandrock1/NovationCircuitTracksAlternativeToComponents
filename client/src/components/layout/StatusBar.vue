<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { on, off } from '@/composables/useMidi.js'

const device  = useDeviceStore()
const midiIn  = ref(false)
const midiOut = ref(false)
let inTimer  = null
let outTimer = null

function flashIn() {
  midiIn.value = true
  clearTimeout(inTimer)
  inTimer = setTimeout(() => { midiIn.value = false }, 80)
}

function flashOut() {
  midiOut.value = true
  clearTimeout(outTimer)
  outTimer = setTimeout(() => { midiOut.value = false }, 80)
}

onMounted(() => {
  on('cc',      flashIn)
  on('noteon',  flashIn)
  on('noteoff', flashIn)
  on('sysex',   flashIn)
  on('sysexout', flashOut)
  on('ccout',    flashOut)
})

onUnmounted(() => {
  off('cc',      flashIn)
  off('noteon',  flashIn)
  off('noteoff', flashIn)
  off('sysex',   flashIn)
  off('sysexout', flashOut)
  off('ccout',    flashOut)
  clearTimeout(inTimer)
  clearTimeout(outTimer)
})
</script>

<template>
  <footer class="status-bar">
    <span class="status-bar__info">Novation Circuit Tracks Web UI</span>

    <div class="status-bar__device">
      <span
        class="status-bar__conn-dot"
        :class="device.connected ? 'status-bar__conn-dot--connected' : 'status-bar__conn-dot--off'"
        :title="device.statusText"
      />
      <span class="status-bar__conn-label">{{ device.statusText }}</span>
    </div>

    <div class="status-bar__midi">
      <span class="status-bar__midi-label">MIDI</span>
      <span class="status-bar__midi-dot" :class="{ 'status-bar__midi-dot--in': midiIn }" title="MIDI In" />
      <span class="status-bar__midi-label status-bar__midi-label--dim">IN</span>
      <span class="status-bar__midi-dot" :class="{ 'status-bar__midi-dot--out': midiOut }" title="MIDI Out" />
      <span class="status-bar__midi-label status-bar__midi-label--dim">OUT</span>
    </div>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  height: 28px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  gap: var(--spacing-md);
}

.status-bar__info { flex: 1; }

.status-bar__device {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-bar__conn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-bar__conn-dot--connected { background: var(--color-success); }
.status-bar__conn-dot--off       { background: var(--color-border); }

.status-bar__conn-label { font-size: 0.72rem; }

.status-bar__midi {
  display: flex;
  align-items: center;
  gap: 3px;
}

.status-bar__midi-label {
  font-weight: 600;
  letter-spacing: 0.05em;
  font-size: 0.65rem;
}
.status-bar__midi-label--dim {
  font-weight: 400;
  color: var(--color-text-dim);
  font-size: 0.6rem;
}

.status-bar__midi-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border);
  transition: background 0.05s;
}

.status-bar__midi-dot--in  { background: var(--color-success); }
.status-bar__midi-dot--out { background: var(--color-info); }
</style>
