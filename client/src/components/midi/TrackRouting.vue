<script setup>
import { useMidiStore } from '@/stores/midi'

const store = useMidiStore()

const TRACK_NAMES = ['MIDI Track 1', 'MIDI Track 2', 'MIDI Track 3', 'MIDI Track 4']
</script>

<template>
  <div class="track-routing">
    <h3 class="track-routing__title">Track Routing</h3>
    <div class="track-routing__table">
      <div class="track-routing__row track-routing__row--header">
        <span>Track</span>
        <span>MIDI Channel</span>
      </div>
      <div
        v-for="(channel, index) in store.trackRouting"
        :key="index"
        class="track-routing__row"
      >
        <span class="track-routing__track-name">{{ TRACK_NAMES[index] }}</span>
        <select
          :value="channel"
          class="track-routing__select"
          @change="store.setTrackChannel(index, Number($event.target.value))"
        >
          <option v-for="ch in 15" :key="ch" :value="ch">{{ ch }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-routing {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.track-routing__title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.track-routing__table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.track-routing__row {
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.track-routing__row--header {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: var(--spacing-xs);
}

.track-routing__track-name {
  font-size: 0.85rem;
}

.track-routing__select {
  width: 80px;
  text-align: center;
  cursor: pointer;
}
</style>
