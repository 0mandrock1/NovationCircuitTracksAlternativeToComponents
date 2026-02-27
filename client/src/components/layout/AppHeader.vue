<script setup>
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()
</script>

<template>
  <header class="app-header">
    <div class="app-header__logo">
      <span class="app-header__logo-text">Circuit Tracks UI</span>
    </div>
    <div class="app-header__status" :class="{ 'app-header__status--connected': device.connected }">
      <span class="app-header__status-dot" />
      <span class="app-header__status-text">{{ device.statusText }}</span>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  height: 48px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.app-header__logo-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.app-header__status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.app-header__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
}

.app-header__status--connected .app-header__status-dot {
  background: var(--color-success);
}

.app-header__status--connected .app-header__status-text {
  color: var(--color-success);
}
</style>
