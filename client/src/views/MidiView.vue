<script setup>
import { useMidiStore } from '@/stores/midi'
import TemplateEditor from '@/components/midi/TemplateEditor.vue'
import TrackRouting   from '@/components/midi/TrackRouting.vue'

const store = useMidiStore()
</script>

<template>
  <div class="midi-view">
    <h2 class="midi-view__title">MIDI Settings</h2>

    <TemplateEditor />
    <TrackRouting />

    <!-- Clock Sync -->
    <div class="midi-card">
      <h3 class="midi-card__title">Clock Sync</h3>
      <div class="midi-card__rows">
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">MIDI Clock In</span>
          <span class="midi-toggle-row__desc">Accept external clock from MIDI</span>
          <input type="checkbox" v-model="store.clockIn" class="midi-checkbox" />
        </label>
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">MIDI Clock Out</span>
          <span class="midi-toggle-row__desc">Send clock over MIDI</span>
          <input type="checkbox" v-model="store.clockOut" class="midi-checkbox" />
        </label>
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">Sync Out (3.5mm)</span>
          <span class="midi-toggle-row__desc">Send analog sync pulse via 3.5mm jack</span>
          <input type="checkbox" v-model="store.syncOut" class="midi-checkbox" />
        </label>
      </div>
    </div>

    <!-- DIN / USB routing -->
    <div class="midi-card">
      <h3 class="midi-card__title">DIN / USB Ports</h3>
      <div class="midi-card__rows">
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">DIN MIDI In</span>
          <span class="midi-toggle-row__desc">Receive MIDI from 5-pin DIN input</span>
          <input type="checkbox" v-model="store.dinMidiIn" class="midi-checkbox" />
        </label>
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">DIN MIDI Out</span>
          <span class="midi-toggle-row__desc">Send MIDI to 5-pin DIN output</span>
          <input type="checkbox" v-model="store.dinMidiOut" class="midi-checkbox" />
        </label>
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">USB MIDI In</span>
          <span class="midi-toggle-row__desc">Receive MIDI from USB host</span>
          <input type="checkbox" v-model="store.usbMidiIn" class="midi-checkbox" />
        </label>
        <label class="midi-toggle-row">
          <span class="midi-toggle-row__label">USB MIDI Out</span>
          <span class="midi-toggle-row__desc">Send MIDI to USB host</span>
          <input type="checkbox" v-model="store.usbMidiOut" class="midi-checkbox" />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.midi-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 900px;
}

.midi-view__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.midi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.midi-card__title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.midi-card__rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.midi-toggle-row {
  display: grid;
  grid-template-columns: 160px 1fr 40px;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.midi-toggle-row:hover { background: var(--color-surface-2); }

.midi-toggle-row__label {
  font-size: 0.85rem;
  font-weight: 500;
}

.midi-toggle-row__desc {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.midi-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-accent);
  justify-self: center;
}
</style>
