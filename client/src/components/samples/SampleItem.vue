<script setup>
import { ref } from 'vue'
import { useSamplesStore } from '@/stores/samples'

const props = defineProps({
  sample: { type: Object, required: true },
  index:  { type: Number, required: true }
})

const store = useSamplesStore()

const renaming = ref(false)
const newName  = ref('')
const playing  = ref(false)
let audioEl = null

function startRename() {
  newName.value  = props.sample.name
  renaming.value = true
}

function confirmRename() {
  if (newName.value.trim()) store.renameSample(props.index, newName.value.trim())
  renaming.value = false
}

function onRenameKey(e) {
  if (e.key === 'Enter')  confirmRename()
  if (e.key === 'Escape') renaming.value = false
}

function playPreview() {
  // Use the locally stored Object URL (no server needed)
  if (!props.sample.audioUrl) return
  if (playing.value && audioEl) {
    audioEl.pause()
    audioEl.currentTime = 0
    playing.value = false
    return
  }
  audioEl = new Audio(props.sample.audioUrl)
  audioEl.onended = () => { playing.value = false }
  audioEl.onerror = () => { playing.value = false }
  audioEl.play()
  playing.value = true
}

async function _uploadToServer(file) {
  const formData = new FormData()
  formData.append('file', file)
  fetch(`/api/samples/${props.index}/upload`, { method: 'POST', body: formData }).catch(() => {})
}

function openFilePicker() {
  const input = document.createElement('input')
  input.type   = 'file'
  input.accept = '.wav,.aiff,.aif,.mp3'
  input.onchange = async () => {
    if (input.files[0]) {
      await store.loadFile(props.index, input.files[0])
      _uploadToServer(input.files[0])
    }
  }
  input.click()
}

async function onDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file) {
    await store.loadFile(props.index, file)
    _uploadToServer(file)
  }
}

function handleSendToDevice() {
  alert('Отправка сэмплов на устройство через MIDI недоступна.\nИспользуйте SD-карту или Novation Components.')
}

function deleteSample() {
  store.deleteSample(props.index)
}
</script>

<template>
  <li
    class="sample-item"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <span class="sample-item__num">{{ String(index + 1).padStart(2, '0') }}</span>

    <span v-if="!renaming" class="sample-item__name" :title="sample.filename ?? ''">
      {{ sample.name }}
    </span>
    <input
      v-else
      class="sample-item__rename-input"
      v-model="newName"
      maxlength="16"
      @blur="confirmRename"
      @keydown="onRenameKey"
      autofocus
    />

    <span class="sample-item__size">
      {{ sample.size ? `${(sample.size / 1024).toFixed(0)}KB` : '—' }}
    </span>

    <div class="sample-item__actions">
      <!-- Play preview (local) -->
      <button
        class="sample-item__btn"
        :class="{ 'sample-item__btn--active': playing }"
        :disabled="!sample.audioUrl"
        @click="playPreview"
        title="Preview (local)"
      >▶</button>

      <!-- Load file (local) -->
      <button class="sample-item__btn" @click="openFilePicker" title="Load audio file">↑</button>

      <!-- Rename -->
      <button class="sample-item__btn" @click="startRename" title="Rename">✎</button>

      <!-- Export local copy -->
      <button
        class="sample-item__btn"
        :disabled="!sample.buffer"
        @click="store.exportSample(index)"
        title="Download local copy"
      >↓</button>

      <!-- Send to device (not available via MIDI) -->
      <button
        class="sample-item__btn sample-item__btn--send"
        :disabled="!sample.buffer && !sample.filename"
        @click="handleSendToDevice"
        title="Send to device (not available via MIDI)"
      >→</button>

      <!-- Delete -->
      <button
        class="sample-item__btn sample-item__btn--danger"
        :disabled="!sample.filename && !sample.buffer"
        @click="deleteSample"
        title="Clear slot"
      >✕</button>
    </div>
  </li>
</template>

<style scoped>
.sample-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 5px var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.sample-item:last-child { border-bottom: none; }
.sample-item:hover { background: var(--color-surface-2); }

.sample-item__num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: 24px;
  flex-shrink: 0;
}

.sample-item__name {
  flex: 1;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sample-item__rename-input {
  flex: 1;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.85rem;
  padding: 2px 6px;
  outline: none;
}

.sample-item__size {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: 44px;
  text-align: right;
  flex-shrink: 0;
}

.sample-item__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.sample-item__btn {
  width: 22px;
  height: 22px;
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

.sample-item__btn:hover:not(:disabled) { border-color: var(--color-text-muted); color: var(--color-text); }
.sample-item__btn:disabled { opacity: 0.3; cursor: not-allowed; }
.sample-item__btn--active  { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.sample-item__btn--busy    { opacity: 0.6; }
.sample-item__btn--send:hover:not(:disabled) { border-color: var(--color-info); color: var(--color-info); }
.sample-item__btn--danger:hover:not(:disabled) { border-color: var(--color-error); color: var(--color-error); }
</style>
