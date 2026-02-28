<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useWebSocket } from '@/composables/useWebSocket'

const device = useDeviceStore()
const midiIn = ref(false)
const midiOut = ref(false)
let inTimer = null
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

// Flash IN on any incoming MIDI from device
const { on } = useWebSocket()
on('midi:cc',    flashIn)
on('midi:sysex', flashIn)

// Flash OUT whenever a CC or SysEx is sent to the device
watch(() => device.midiOutCount, flashOut)

onUnmounted(() => {
  clearTimeout(inTimer)
  clearTimeout(outTimer)
})
</script>

<template>
  <footer class="status-bar">
    <span class="status-bar__info">Novation Circuit Tracks Web UI</span>
    <div class="status-bar__midi">
      <span class="status-bar__midi-label">MIDI</span>
      <span class="status-bar__midi-dot" :class="{ 'status-bar__midi-dot--active': midiIn }" title="MIDI In" />
      <span class="status-bar__midi-dot" :class="{ 'status-bar__midi-dot--active': midiOut }" title="MIDI Out" />
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
}

.status-bar__midi {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-bar__midi-label {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.status-bar__midi-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border);
  transition: background 0.05s;
}

.status-bar__midi-dot--active {
  background: var(--color-accent);
}
</style>
