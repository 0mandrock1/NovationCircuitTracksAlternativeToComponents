<script setup>
import { onMounted } from 'vue'
import { useSamplesStore } from '@/stores/samples'
import SampleList from '@/components/samples/SampleList.vue'

const store = useSamplesStore()
onMounted(() => store.fetchSamples())
</script>

<template>
  <div class="samples-view">
    <h2>Samples</h2>
    <SampleList />
  </div>
</template>

<style scoped>
.samples-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
