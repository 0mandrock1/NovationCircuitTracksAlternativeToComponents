<script setup>
import { onMounted } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import ProjectGrid from '@/components/sessions/ProjectGrid.vue'

const store = useSessionsStore()
onMounted(() => store.fetchProjects())
</script>

<template>
  <div class="sessions-view">
    <h2>Sessions</h2>
    <ProjectGrid />
  </div>
</template>

<style scoped>
.sessions-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
