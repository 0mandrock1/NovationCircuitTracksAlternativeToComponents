<script setup>
import { ref } from 'vue'
import { useSamplesStore } from '@/stores/samples'

const props = defineProps({
  sample: { type: Object, required: true },
  index: { type: Number, required: true }
})

const store = useSamplesStore()
const renaming = ref(false)
const newName = ref('')
const playing = ref(false)
const dragOver = ref(false)
let audioEl = null

function startRename() {
  newName.value = props.sample.name
  renaming.value = true
}

async function confirmRename() {
  if (newName.value.trim()) {
    await store.renameSample(props.index, newName.value.trim())
  }
  renaming.value = false
}

function onRenameKey(e) {
  if (e.key === 'Enter') confirmRename()
  if (e.key === 'Escape') renaming.value = false
}

function playPreview() {
  if (!props.sample.filename) return
  if (playing.value && audioEl) {
    audioEl.pause()
    audioEl.currentTime = 0
    playing.value = false
    return
  }
  audioEl = new Audio(`/api/samples/${props.index}/audio`)
  audioEl.onended = () => { playing.value = false }
  audioEl.onerror = () => { playing.value = false }
  audioEl.play()
  playing.value = true
}

function downloadSample() {
  if (!props.sample.filename) return
  const a = document.createElement('a')
  a.href = `/api/samples/${props.index}/download`
  a.download = props.sample.name
  a.click()
}

function openFilePicker() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.wav,.aiff,.aif,.mp3'
  input.onchange = async () => {
    if (input.files[0]) await store.uploadSample(props.index, input.files[0])
  }
  input.click()
}

async function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) await store.uploadSample(props.index, file)
}

async function deleteSample() {
  if (confirm(`Удалить сэмпл "${props.sample.name}"?`)) {
    await store.deleteSample(props.index)
  }
}
</script>

<template>
  <li
    class="sample-item"
    :class="{ 'sample-item--drag': dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <span class="sample-item__num">{{ String(index + 1).padStart(2, '0') }}</span>

    <span v-if="!renaming" class="sample-item__name">{{ sample.name }}</span>
    <input
      v-else
      class="sample-item__rename-input"
      v-model="newName"
      maxlength="16"
      @blur="confirmRename"
      @keydown="onRenameKey"
      autofocus
    />

    <span class="sample-item__size">{{ sample.size ? `${(sample.size / 1024).toFixed(1)}KB` : '—' }}</span>

    <div class="sample-item__actions">
      <button
        class="sample-item__btn"
        :class="{ 'sample-item__btn--active': playing }"
        :disabled="!sample.filename"
        @click="playPreview"
        title="Preview"
      >▶</button>
      <button class="sample-item__btn" @click="openFilePicker" title="Replace">↑</button>
      <button class="sample-item__btn" @click="startRename" title="Rename">✎</button>
      <button
        class="sample-item__btn"
        :disabled="!sample.filename"
        @click="downloadSample"
        title="Download"
      >↓</button>
      <button
        class="sample-item__btn sample-item__btn--danger"
        :disabled="!sample.filename"
        @click="deleteSample"
        title="Delete"
      >✕</button>
    </div>
  </li>
</template>

<style scoped>
.sample-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.sample-item:last-child {
  border-bottom: none;
}

.sample-item:hover {
  background: var(--color-surface-2);
}

.sample-item--drag {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-color: var(--color-accent);
}

.sample-item__num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  width: 24px;
  flex-shrink: 0;
}

.sample-item__name {
  flex: 1;
  font-size: 0.9rem;
}

.sample-item__rename-input {
  flex: 1;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.9rem;
  padding: 2px 6px;
  outline: none;
}

.sample-item__size {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  width: 48px;
  text-align: right;
  flex-shrink: 0;
}

.sample-item__actions {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.sample-item__btn {
  width: 24px;
  height: 24px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sample-item__btn:hover:not(:disabled) {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.sample-item__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sample-item__btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.sample-item__btn--danger:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
