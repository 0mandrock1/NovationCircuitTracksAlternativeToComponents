<script setup>
import { onMounted } from 'vue'
import { usePatchesStore } from '@/stores/patches'
import PatchList from '@/components/patches/PatchList.vue'

const store = usePatchesStore()
onMounted(() => store.fetchPatches())
</script>

<template>
  <div class="patches-view">
    <h2>Patches</h2>
    <PatchList />
  </div>
</template>

<style scoped>
.patches-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
