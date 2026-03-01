<script setup>
import { ref } from 'vue'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()

const theme = ref(localStorage.getItem('theme') || 'dark')

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('theme', theme.value)
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__logo">
      <span class="app-header__logo-text">Circuit Tracks UI</span>
    </div>

    <div class="app-header__right">
      <button
        class="app-header__theme-btn"
        :title="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="toggleTheme"
      >
        {{ theme === 'dark' ? '☀' : '🌙' }}
      </button>

      <div class="app-header__status" :class="{ 'app-header__status--connected': device.connected }">
        <span class="app-header__status-dot" />
        <span class="app-header__status-text">{{ device.statusText }}</span>
      </div>
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

.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.app-header__theme-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition-fast);
  color: var(--color-text);
}
.app-header__theme-btn:hover { border-color: var(--color-text-muted); }

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
