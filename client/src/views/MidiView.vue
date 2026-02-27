<script setup>
import { useMidiStore } from '@/stores/midi'
import TemplateEditor from '@/components/midi/TemplateEditor.vue'
import TrackRouting from '@/components/midi/TrackRouting.vue'

const store = useMidiStore()
</script>

<template>
  <div class="midi-view">
    <h2>MIDI Settings</h2>
    <TemplateEditor />
    <TrackRouting />
  </div>
</template>

<style scoped>
.midi-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 900px;
}
</style>
