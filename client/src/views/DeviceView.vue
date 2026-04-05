<script setup>
import { ref } from 'vue'
import DevicePanel    from '@/components/device/DevicePanel.vue'
import MidiTesterView from '@/views/MidiTesterView.vue'

const subTab = ref('device')
const SUB_TABS = [
  { id: 'device', label: 'Device' },
  { id: 'tester', label: 'MIDI Tester' },
]
</script>

<template>
  <div class="device-view">
    <nav class="device-view__subtabs">
      <button
        v-for="tab in SUB_TABS"
        :key="tab.id"
        class="subtab"
        :class="{ 'subtab--active': subTab === tab.id }"
        @click="subTab = tab.id"
      >{{ tab.label }}</button>
    </nav>

    <div class="device-view__content">
      <DevicePanel    v-if="subTab === 'device'" />
      <MidiTesterView v-else-if="subTab === 'tester'" />
    </div>
  </div>
</template>

<style scoped>
.device-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.device-view__subtabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.subtab {
  padding: 5px var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.subtab:hover { color: var(--color-text); }
.subtab--active { color: var(--color-accent); border-bottom-color: var(--color-accent); }

.device-view__content {
  flex: 1;
  overflow: hidden;
  padding-top: var(--spacing-sm);
}
</style>
