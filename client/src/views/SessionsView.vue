<script setup>
import { onMounted, ref } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import ProjectGrid from '@/components/sessions/ProjectGrid.vue'
import SceneList   from '@/components/sessions/SceneList.vue'

const store   = useSessionsStore()
const subTab  = ref('projects')
const editingPack = ref(-1)
const editPackName = ref('')

onMounted(() => {
  store.fetchProjects()
  store.fetchPacks()
})

function handleImport(e) {
  const file = e.target.files[0]
  if (file && store.activeProjectIndex >= 0) {
    store.importProject(store.activeProjectIndex, file)
  }
  e.target.value = ''
}

function startEditPack(index) {
  editingPack.value = index
  editPackName.value = store.packs[index].name
}

async function commitEditPack(index) {
  if (editPackName.value.trim()) {
    await store.renamePack(index, editPackName.value.trim())
  }
  editingPack.value = -1
}

function cancelEditPack() {
  editingPack.value = -1
}
</script>

<template>
  <div class="sessions-view">
    <div class="sessions-view__header">
      <h2 class="sessions-view__title">Sessions</h2>
      <div class="sessions-view__tabs">
        <button
          class="sv-tab"
          :class="{ 'sv-tab--active': subTab === 'projects' }"
          @click="subTab = 'projects'"
        >Projects</button>
        <button
          class="sv-tab"
          :class="{ 'sv-tab--active': subTab === 'packs' }"
          @click="subTab = 'packs'"
        >Packs</button>
      </div>
    </div>

    <!-- Projects tab -->
    <div v-if="subTab === 'projects'" class="sessions-view__layout">
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

    <!-- Packs tab -->
    <div v-else class="sessions-view__packs">
      <div class="packs-list">
        <div
          v-for="pack in store.packs"
          :key="pack.index"
          class="pack-item"
        >
          <span class="pack-item__num">{{ String(pack.index + 1).padStart(2, '0') }}</span>

          <template v-if="editingPack === pack.index">
            <input
              class="pack-item__input"
              v-model="editPackName"
              maxlength="16"
              @keydown.enter="commitEditPack(pack.index)"
              @keydown.escape="cancelEditPack"
              @blur="commitEditPack(pack.index)"
              autofocus
            />
          </template>
          <template v-else>
            <span class="pack-item__name">{{ pack.name }}</span>
          </template>

          <span class="pack-item__count">{{ pack.sampleCount }} samples</span>

          <div class="pack-item__actions">
            <button class="sp-btn" title="Rename" @click="startEditPack(pack.index)">✎</button>
            <button class="sp-btn" title="Export pack" @click="store.exportPack(pack.index)">↑</button>
          </div>
        </div>
      </div>
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

.sessions-view__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.sessions-view__title {
  font-size: 1.1rem;
  font-weight: 600;
}

.sessions-view__tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--color-border);
}

.sv-tab {
  padding: 4px 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.sv-tab:hover { color: var(--color-text); }
.sv-tab--active { color: var(--color-accent); border-bottom-color: var(--color-accent); }

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

/* ── Packs ──────────────────────────────────────────────────────────────────── */
.sessions-view__packs {
  flex: 1;
  overflow-y: auto;
}

.packs-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 600px;
}

.pack-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color var(--transition-fast);
}
.pack-item:hover { border-color: var(--color-text-muted); }

.pack-item__num {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-muted);
  width: 22px;
  flex-shrink: 0;
}

.pack-item__name {
  flex: 1;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-item__input {
  flex: 1;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  padding: 2px 6px;
  outline: none;
}

.pack-item__count {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  width: 70px;
  text-align: right;
}

.pack-item__actions {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
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
