<script setup>
import { ref } from 'vue'
import { usePatchesStore } from '@/stores/patches'
import { useDeviceStore  } from '@/stores/device'

const store  = usePatchesStore()
const device = useDeviceStore()

const hoveredIndex  = ref(-1)
const renamingIndex = ref(-1)
const renameValue   = ref('')

function startRename(index, currentName) {
  renamingIndex.value = index
  renameValue.value   = currentName
}

async function commitRename(index) {
  if (renameValue.value.trim()) await store.renamePatch(index, renameValue.value.trim())
  renamingIndex.value = -1
}

function cancelRename() {
  renamingIndex.value = -1
}
</script>

<template>
  <div class="patch-list">
    <div v-if="store.loading" class="patch-list__loading">Loading…</div>
    <ul v-else class="patch-list__items">
      <li
        v-for="patch in store.patches[store.activeTrack]"
        :key="patch.index"
        class="patch-list__item"
        :class="{
          'patch-list__item--active':  store.activePatchIndex === patch.index,
          'patch-list__item--has-data': patch.hasData,
        }"
        @mouseenter="hoveredIndex = patch.index"
        @mouseleave="hoveredIndex = -1"
        @click="store.activePatchIndex = patch.index"
      >
        <!-- Number -->
        <span class="patch-list__num">{{ String(patch.index + 1).padStart(2, '0') }}</span>

        <!-- Name / rename input -->
        <template v-if="renamingIndex === patch.index">
          <input
            v-model="renameValue"
            class="patch-list__rename"
            maxlength="16"
            @keydown.enter="commitRename(patch.index)"
            @keydown.escape="cancelRename"
            @blur="commitRename(patch.index)"
            @click.stop
            v-focus
          />
        </template>
        <span v-else class="patch-list__name">{{ patch.name }}</span>

        <!-- Data dot -->
        <span v-if="patch.hasData" class="patch-list__dot" title="Data loaded" />

        <!-- Action buttons (shown on hover or when active) -->
        <div
          v-if="hoveredIndex === patch.index || store.activePatchIndex === patch.index"
          class="patch-list__actions"
          @click.stop
        >
          <!-- Send to device (audition) -->
          <button
            class="patch-list__btn"
            :disabled="!device.connected || !patch.hasData"
            :title="device.connected ? 'Audition on device' : 'Connect device first'"
            @click="store.sendToDevice(patch.index)"
          >▶</button>

          <!-- Write to bank slot -->
          <button
            class="patch-list__btn"
            :disabled="!device.connected || !patch.hasData"
            :title="device.connected ? 'Write to device bank slot' : 'Connect device first'"
            @click="store.writeToDevice(patch.index)"
          >✦</button>

          <!-- Export .syx -->
          <button
            class="patch-list__btn"
            :disabled="!patch.hasData"
            title="Export as .syx"
            @click="store.exportPatchSyx(patch.index)"
          >↑</button>

          <!-- Rename -->
          <button
            class="patch-list__btn"
            title="Rename"
            @click="startRename(patch.index, patch.name)"
          >✎</button>

          <!-- Delete -->
          <button
            class="patch-list__btn patch-list__btn--danger"
            title="Clear patch slot"
            @click="store.deletePatch(patch.index)"
          >✕</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<!-- Custom v-focus directive -->
<script>
export default {
  directives: {
    focus: { mounted: (el) => el.focus() }
  }
}
</script>

<style scoped>
.patch-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.patch-list__loading {
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.85rem;
}

.patch-list__items { list-style: none; }

.patch-list__item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 30px;
  position: relative;
}

.patch-list__item:last-child { border-bottom: none; }
.patch-list__item:hover { background: var(--color-surface-2); }

.patch-list__item--active {
  background: var(--color-surface-3);
  border-left: 3px solid var(--color-accent);
}

.patch-list__num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: 20px;
  flex-shrink: 0;
}

.patch-list__name {
  font-size: 0.82rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.patch-list__rename {
  flex: 1;
  font-size: 0.82rem;
  padding: 1px 4px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: 3px;
  color: var(--color-text);
  outline: none;
}

.patch-list__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-success);
  flex-shrink: 0;
}

.patch-list__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.patch-list__btn {
  width: 20px;
  height: 20px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  padding: 0;
}

.patch-list__btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.patch-list__btn:disabled { opacity: 0.3; cursor: default; }

.patch-list__btn--danger:hover:not(:disabled) {
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>
