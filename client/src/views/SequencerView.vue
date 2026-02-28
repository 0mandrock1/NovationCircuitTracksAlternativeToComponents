<script setup>
import { useSequencerStore } from '@/stores/sequencer'
import StepGrid from '@/components/sequencer/StepGrid.vue'

const store = useSequencerStore()
</script>

<template>
  <div class="sequencer-view">
    <h2>Sequencer</h2>
    <StepGrid />
  </div>
</template>

<style scoped>
.sequencer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
