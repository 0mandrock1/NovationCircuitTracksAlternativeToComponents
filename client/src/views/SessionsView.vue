<script setup>
import { onMounted } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import ProjectGrid from '@/components/sessions/ProjectGrid.vue'
import SceneList   from '@/components/sessions/SceneList.vue'

const store = useSessionsStore()
onMounted(() => store.fetchProjects())

function handleImport(e) {
  const file = e.target.files[0]
  if (file && store.activeProjectIndex >= 0) {
    store.importProject(store.activeProjectIndex, file)
  }
  e.target.value = ''
}
</script>

<template>
  <div class="sessions-view">
    <h2 class="sessions-view__title">Sessions</h2>

    <div class="sessions-view__layout">
      <!-- Project grid (left) -->
      <div class="sessions-view__grid-wrap">
        <ProjectGrid />
      </div>

      <!-- Selected project panel (right) -->
      <aside class="sessions-view__sidebar" v-if="store.activeProjectIndex >= 0">
        <div class="sessions-panel">
          <div class="sessions-panel__header">
            <span class="sessions-panel__num">{{ store.activeProjectIndex + 1 }}</span>
            <span class="sessions-panel__name">{{ store.projects[store.activeProjectIndex]?.name }}</span>
          </div>

          <div class="sessions-panel__actions">
            <button
              class="sp-btn"
              title="Export project"
              @click="store.exportProject(store.activeProjectIndex)"
            >↑ Export</button>

            <label class="sp-btn" title="Import project">
              ↓ Import
              <input type="file" accept=".json" style="display:none" @change="handleImport" />
            </label>
          </div>
        </div>

        <SceneList :project-index="store.activeProjectIndex" />
      </aside>

      <aside class="sessions-view__sidebar sessions-view__sidebar--empty" v-else>
        <p>Click a project slot to select it.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.sessions-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
  overflow: hidden;
}

.sessions-view__title {
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.sessions-view__layout {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  overflow: hidden;
}

.sessions-view__grid-wrap {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.sessions-view__sidebar {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
}

.sessions-view__sidebar--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.sessions-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.sessions-panel__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.sessions-panel__num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sessions-panel__name {
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sessions-panel__actions {
  display: flex;
  gap: var(--spacing-xs);
}

.sp-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.sp-btn:hover { border-color: var(--color-text-muted); }
</style>
