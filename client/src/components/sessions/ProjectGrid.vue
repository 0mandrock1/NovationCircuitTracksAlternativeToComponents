<script setup>
import { useSessionsStore } from '@/stores/sessions'

const store = useSessionsStore()
</script>

<template>
  <div class="project-grid">
    <div v-if="store.loading" class="project-grid__loading">Loading projects...</div>
    <div v-else class="project-grid__grid">
      <button
        v-for="(project, index) in store.projects"
        :key="index"
        class="project-grid__item"
        :class="{ 'project-grid__item--active': store.activeProjectIndex === index }"
        @click="store.activeProjectIndex = index"
        :title="project.name"
      >
        <span class="project-grid__item-num">{{ index + 1 }}</span>
        <span class="project-grid__item-name">{{ project.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.project-grid {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.project-grid__loading {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-md);
}

.project-grid__grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.project-grid__item {
  aspect-ratio: 1;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all var(--transition-fast);
  padding: 4px;
  overflow: hidden;
}

.project-grid__item:hover {
  border-color: var(--color-text-muted);
  background: var(--color-surface-3);
}

.project-grid__item--active {
  border-color: var(--color-accent);
  background: var(--color-surface-3);
}

.project-grid__item-num {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.project-grid__item-name {
  font-size: 0.6rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}
</style>
