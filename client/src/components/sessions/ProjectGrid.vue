<script setup>
import { ref } from 'vue'
import { useSessionsStore } from '@/stores/sessions'

const store = useSessionsStore()

const hoveredIndex  = ref(-1)
const renamingIndex = ref(-1)
const renameValue   = ref('')
const copyTarget    = ref(-1)

const PROJECT_COLORS = [
  '#555', '#e24', '#f80', '#fc0', '#0c6', '#09f', '#55f', '#a4f',
]

function startRename(index, name, e) {
  e.stopPropagation()
  renamingIndex.value = index
  renameValue.value   = name
}

async function commitRename(index) {
  if (renameValue.value.trim()) await store.renameProject(index, renameValue.value.trim())
  renamingIndex.value = -1
}

function cancelRename() { renamingIndex.value = -1 }

async function doCopy(srcIndex, e) {
  e.stopPropagation()
  const dst = prompt(`Copy project ${srcIndex + 1} to slot (1-64):`)
  const n   = parseInt(dst, 10)
  if (n >= 1 && n <= 64) await store.copyProject(srcIndex, n - 1)
}

async function doDelete(index, e) {
  e.stopPropagation()
  if (confirm(`Clear project ${index + 1} "${store.projects[index].name}"?`)) {
    await store.deleteProject(index)
  }
}
</script>

<template>
  <div class="project-grid">
    <div v-if="store.loading" class="project-grid__loading">Loading projects…</div>
    <div v-else class="project-grid__grid">
      <div
        v-for="(project, index) in store.projects"
        :key="index"
        class="project-grid__item"
        :class="{ 'project-grid__item--active': store.activeProjectIndex === index }"
        :style="project.color ? { borderColor: PROJECT_COLORS[project.color % PROJECT_COLORS.length] } : {}"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = -1"
        @click="store.selectProject(index)"
      >
        <span class="project-grid__num">{{ index + 1 }}</span>

        <template v-if="renamingIndex === index">
          <input
            class="project-grid__rename"
            v-model="renameValue"
            maxlength="16"
            @keydown.enter.stop="commitRename(index)"
            @keydown.escape.stop="cancelRename"
            @blur="commitRename(index)"
            @click.stop
            v-autofocus
          />
        </template>
        <span v-else class="project-grid__name">{{ project.name }}</span>

        <!-- Hover actions -->
        <div
          v-if="hoveredIndex === index && renamingIndex !== index"
          class="project-grid__actions"
          @click.stop
        >
          <button class="project-grid__btn" title="Rename" @click="startRename(index, project.name, $event)">✎</button>
          <button class="project-grid__btn" title="Copy" @click="doCopy(index, $event)">⧉</button>
          <button class="project-grid__btn" title="Export" @click="store.exportProject(index)">↑</button>
          <button class="project-grid__btn project-grid__btn--danger" title="Clear" @click="doDelete(index, $event)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- v-autofocus directive -->
<script>
export default {
  directives: { autofocus: { mounted: el => el.focus() } }
}
</script>

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
  position: relative;
}

.project-grid__item:hover { border-color: var(--color-text-muted); background: var(--color-surface-3); }

.project-grid__item--active {
  border-color: var(--color-accent);
  background: var(--color-surface-3);
}

.project-grid__num {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.project-grid__name {
  font-size: 0.6rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.project-grid__rename {
  font-size: 0.6rem;
  width: 100%;
  background: var(--color-surface-3);
  border: 1px solid var(--color-accent);
  border-radius: 2px;
  color: var(--color-text);
  outline: none;
  padding: 1px 2px;
  text-align: center;
}

.project-grid__actions {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 1px;
}

.project-grid__btn {
  width: 14px;
  height: 14px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all var(--transition-fast);
}

.project-grid__btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.project-grid__btn--danger:hover { border-color: var(--color-error); color: var(--color-error); }
</style>
