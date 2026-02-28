<script setup>
import { useSamplesStore } from '@/stores/samples'
import SampleItem from './SampleItem.vue'

const store = useSamplesStore()
</script>

<template>
  <div class="sample-list">
    <div v-if="store.loading" class="sample-list__loading">Loading samples...</div>
    <ul v-else class="sample-list__items">
      <SampleItem
        v-for="(sample, index) in store.samples"
        :key="index"
        :sample="sample"
        :index="index"
      />
    </ul>
  </div>
</template>

<style scoped>
.sample-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.sample-list__loading {
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.85rem;
}

.sample-list__items {
  list-style: none;
}
</style>
