<script setup>
import { ref, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()

const tempo       = ref(120)
const swing       = ref(0)
const transpose   = ref(0)
const applyStatus = ref('')

onMounted(() => {
  device.fetchPorts()
})

async function handleConnect(port) {
  await device.connect(port)
}

async function handleDisconnect() {
  await device.disconnect()
}

async function applyTempo() {
  await postSetting('tempo', { bpm: tempo.value })
}

async function applySwing() {
  await postSetting('swing', { amount: swing.value })
}

async function applyTranspose() {
  await postSetting('transpose', { semitones: transpose.value })
}

async function postSetting(endpoint, body) {
  try {
    const res  = await fetch(`/api/device/${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    applyStatus.value = data.ok ? 'Sent ✓' : (data.error ?? 'Error')
  } catch {
    applyStatus.value = 'No device'
  }
  setTimeout(() => { applyStatus.value = '' }, 2000)
}
</script>

<template>
  <div class="device-panel">
    <h2 class="device-panel__title">Device</h2>

    <!-- Connection status -->
    <section class="device-panel__section">
      <h3 class="device-panel__section-title">Connection Status</h3>
      <div class="device-panel__status" :class="{ 'device-panel__status--connected': device.connected }">
        <span class="device-panel__status-dot" />
        <span>{{ device.connected ? 'Connected' : 'Disconnected' }}</span>
        <span v-if="device.portName" class="device-panel__port-name">— {{ device.portName }}</span>
      </div>
      <div v-if="device.firmwareVersion" class="device-panel__firmware">
        Firmware: {{ device.firmwareVersion }}
      </div>
    </section>

    <!-- MIDI port list -->
    <section class="device-panel__section">
      <h3 class="device-panel__section-title">MIDI Port</h3>
      <div v-if="device.availablePorts.length === 0" class="device-panel__no-ports">
        No MIDI ports found. Make sure Circuit Tracks is connected via USB.
      </div>
      <ul v-else class="device-panel__port-list">
        <li
          v-for="port in device.availablePorts"
          :key="port"
          class="device-panel__port-item"
          :class="{ 'device-panel__port-item--active': device.portName === port }"
        >
          <span class="device-panel__port-item-name">{{ port }}</span>
          <button
            v-if="device.portName !== port"
            class="btn btn--primary btn--sm"
            @click="handleConnect(port)"
          >Connect</button>
          <button
            v-else
            class="btn btn--danger btn--sm"
            @click="handleDisconnect"
          >Disconnect</button>
        </li>
      </ul>
      <button class="btn btn--secondary" style="margin-top: 12px" @click="device.fetchPorts()">
        Refresh Ports
      </button>
    </section>

    <!-- Global settings -->
    <section class="device-panel__section">
      <h3 class="device-panel__section-title">Global Settings</h3>

      <div class="gs-row">
        <label class="gs-label" for="gs-tempo">Tempo (BPM 40–240)</label>
        <input
          id="gs-tempo"
          class="gs-number"
          type="number"
          min="40" max="240"
          v-model.number="tempo"
          @keydown.enter="applyTempo"
        />
        <button class="btn btn--sm btn--secondary" @click="applyTempo">Apply</button>
      </div>

      <div class="gs-row">
        <label class="gs-label" for="gs-swing">Swing (0–100%)</label>
        <input
          id="gs-swing"
          class="gs-range"
          type="range"
          min="0" max="100"
          v-model.number="swing"
        />
        <span class="gs-val">{{ swing }}%</span>
        <button class="btn btn--sm btn--secondary" @click="applySwing">Apply</button>
      </div>

      <div class="gs-row">
        <label class="gs-label" for="gs-transpose">Transpose (−12 … +12)</label>
        <input
          id="gs-transpose"
          class="gs-number"
          type="number"
          min="-12" max="12"
          v-model.number="transpose"
          @keydown.enter="applyTranspose"
        />
        <button class="btn btn--sm btn--secondary" @click="applyTranspose">Apply</button>
      </div>

      <div v-if="applyStatus" class="gs-status">{{ applyStatus }}</div>
    </section>

    <!-- Firmware -->
    <section class="device-panel__section">
      <h3 class="device-panel__section-title">Firmware</h3>
      <div class="device-panel__firmware">
        <span v-if="device.firmwareVersion">Version: {{ device.firmwareVersion }}</span>
        <span v-else class="device-panel__no-ports">Version unknown — connect device to read</span>
      </div>
      <div class="fw-update">
        <p class="fw-update__note">
          To update firmware, select a .syx file obtained from Focusrite:
        </p>
        <label class="btn btn--secondary btn--sm fw-update__btn" title="Not yet implemented">
          Select firmware .syx…
          <input type="file" accept=".syx" style="display:none" disabled />
        </label>
        <span class="fw-update__badge">UI placeholder — not yet implemented</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.device-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.device-panel__title {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-xs);
}

.device-panel__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.device-panel__section-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xs);
}

.device-panel__status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1rem;
  color: var(--color-text-muted);
}

.device-panel__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-text-muted);
  flex-shrink: 0;
}

.device-panel__status--connected { color: var(--color-success); }
.device-panel__status--connected .device-panel__status-dot { background: var(--color-success); }

.device-panel__port-name {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.device-panel__firmware {
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.device-panel__no-ports {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.device-panel__port-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.device-panel__port-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.device-panel__port-item--active { border-color: var(--color-success); }

.device-panel__port-item-name {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

/* ── Global settings ────────────────────────────────────────────────────────── */
.gs-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.gs-label {
  font-size: 0.82rem;
  color: var(--color-text-dim);
  width: 180px;
  flex-shrink: 0;
}

.gs-number {
  width: 72px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  padding: 3px 6px;
  outline: none;
  transition: border-color var(--transition-fast);
}
.gs-number:focus { border-color: var(--color-accent); }

.gs-range {
  flex: 1;
  min-width: 80px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.gs-val {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-muted);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.gs-status {
  font-size: 0.78rem;
  color: var(--color-success);
  font-family: var(--font-mono);
  padding-top: var(--spacing-xs);
}

/* ── Firmware ────────────────────────────────────────────────────────────────── */
.fw-update {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.fw-update__note {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.fw-update__btn {
  align-self: flex-start;
  opacity: 0.5;
  cursor: not-allowed;
}

.fw-update__badge {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  align-self: flex-start;
}

/* ── Shared button styles ────────────────────────────────────────────────────── */
.btn {
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background var(--transition-fast);
}
.btn--sm { padding: 3px 10px; font-size: 0.75rem; }
.btn--primary { background: var(--color-accent); color: #fff; }
.btn--primary:hover { background: var(--color-accent-hover); }
.btn--secondary { background: var(--color-surface-3); color: var(--color-text); border: 1px solid var(--color-border); }
.btn--secondary:hover { border-color: var(--color-text-muted); }
.btn--danger { background: transparent; color: var(--color-text-muted); border: 1px solid var(--color-border); }
.btn--danger:hover { border-color: var(--color-accent); color: var(--color-accent); }
</style>
