<script setup>
import { ref } from 'vue'
import { useSessionsStore } from '@/stores/sessions'

const props = defineProps({
  projectIndex: { type: Number, required: true }
})

const store = useSessionsStore()

const renamingIndex = ref(-1)
const renameValue   = ref('')

const TRACK_NAMES = ['Synth 1', 'Synth 2', 'MIDI 1', 'MIDI 2', 'MIDI 3', 'MIDI 4', 'Drum 1', 'Drum 2']

function startRename(index, name) {
  renamingIndex.value = index
  renameValue.value   = name
}

async function commitRename(index) {
  if (renameValue.value.trim()) {
    await store.renameScene(props.projectIndex, index, renameValue.value.trim())
  }
  renamingIndex.value = -1
}
</script>

<template>
  <div class="scene-list" v-if="store.activeProject">
    <h3 class="scene-list__title">Scenes — {{ store.activeProject.name }}</h3>

    <div class="scene-list__header">
      <span class="scene-list__col-name">Scene</span>
      <span
        v-for="(name, i) in TRACK_NAMES" :key="i"
        class="scene-list__col-track"
      >{{ name }}</span>
    </div>

    <div
      v-for="(scene, i) in store.activeProject.scenes"
      :key="i"
      class="scene-list__row"
    >
      <!-- Scene name / rename -->
      <div class="scene-list__col-name">
        <template v-if="renamingIndex === i">
          <input
            class="scene-list__rename"
            v-model="renameValue"
            maxlength="16"
            @keydown.enter="commitRename(i)"
            @keydown.escape="renamingIndex = -1"
            @blur="commitRename(i)"
            v-autofocus
          />
        </template>
        <span v-else class="scene-list__scene-name" @dblclick="startRename(i, scene.name)">
          {{ scene.name }}
        </span>
      </div>

      <!-- Pattern slots per track -->
      <div
        v-for="(pat, t) in scene.patterns"
        :key="t"
        class="scene-list__col-track scene-list__pattern-slot"
        :class="{ 'scene-list__pattern-slot--set': pat !== null }"
      >
        {{ pat !== null ? `P${pat + 1}` : '—' }}
      </div>
    </div>
  </div>

  <div v-else class="scene-list scene-list--empty">
    Select a project to view its scenes.
  </div>
</template>

<!-- v-autofocus directive -->
<script>
export default {
  directives: { autofocus: { mounted: el => el.focus() } }
}
</script>

<style scoped>
.scene-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.scene-list--empty {
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.scene-list__title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.scene-list__header,
.scene-list__row {
  display: grid;
  grid-template-columns: 140px repeat(8, 1fr);
  align-items: center;
  gap: 2px;
  padding: 4px var(--spacing-md);
}

.scene-list__header {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.scene-list__row {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.scene-list__row:last-child { border-bottom: none; }
.scene-list__row:hover { background: var(--color-surface-2); }

.scene-list__col-name {
  font-size: 0.82rem;
}

.scene-list__col-track {
  font-size: 0.7rem;
  text-align: center;
  color: var(--color-text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.scene-list__scene-name {
  cursor: text;
}

.scene-list__rename {
  font-size: 0.82rem;
  width: 100%;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: 3px;
  color: var(--color-text);
  outline: none;
  padding: 1px 4px;
}

.scene-list__pattern-slot {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 2px 0;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.scene-list__pattern-slot--set {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
