<script setup>
import { onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()

onMounted(() => {
  device.fetchPorts()
})

async function handleConnect(port) {
  await device.connect(port)
}

async function handleDisconnect() {
  await device.disconnect()
}
</script>

<template>
  <div class="device-panel">
    <h2 class="device-panel__title">Device</h2>

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
          >
            Connect
          </button>
          <button
            v-else
            class="btn btn--danger btn--sm"
            @click="handleDisconnect"
          >
            Disconnect
          </button>
        </li>
      </ul>
      <button class="btn btn--secondary" style="margin-top: 12px" @click="device.fetchPorts()">
        Refresh Ports
      </button>
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

.device-panel__status--connected {
  color: var(--color-success);
}

.device-panel__status--connected .device-panel__status-dot {
  background: var(--color-success);
}

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

.device-panel__port-item--active {
  border-color: var(--color-success);
}

.device-panel__port-item-name {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

/* Shared button styles (used here and will be global later) */
.btn {
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background var(--transition-fast);
}

.btn--sm {
  padding: 3px 10px;
  font-size: 0.75rem;
}

.btn--primary {
  background: var(--color-accent);
  color: #fff;
}

.btn--primary:hover {
  background: var(--color-accent-hover);
}

.btn--secondary {
  background: var(--color-surface-3);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover {
  border-color: var(--color-text-muted);
}

.btn--danger {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.btn--danger:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
