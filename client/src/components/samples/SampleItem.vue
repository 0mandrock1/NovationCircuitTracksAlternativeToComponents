<script setup>
import { ref } from 'vue'
import { useSamplesStore } from '@/stores/samples'

const props = defineProps({
  sample: { type: Object, required: true },
  index:  { type: Number, required: true },
})

const store = useSamplesStore()

// Playback state
let audioCtx    = null
let sourceNode  = null
const playing   = ref(false)

async function togglePlay() {
  if (playing.value) {
    sourceNode?.stop()
    playing.value = false
    return
  }
  if (!props.sample.hasFile) return

  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') await audioCtx.resume()

    const resp   = await fetch(store.streamUrl(props.index))
    const buf    = await resp.arrayBuffer()
    const decoded = await audioCtx.decodeAudioData(buf)

    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = decoded
    sourceNode.connect(audioCtx.destination)
    sourceNode.start()
    playing.value = true
    sourceNode.onended = () => { playing.value = false }
  } catch {
    playing.value = false
  }
}

// Rename
const renaming  = ref(false)
const renameVal = ref('')

function startRename() {
  renaming.value = true
  renameVal.value = props.sample.name
}

async function commitRename() {
  if (renameVal.value.trim()) await store.renameSample(props.index, renameVal.value.trim())
  renaming.value = false
}

// Drag-and-drop onto this slot
const dragOver = ref(false)

function onDragover(e) {
  e.preventDefault()
  dragOver.value = true
}

function onDragleave() { dragOver.value = false }

async function onDrop(e) {
  e.preventDefault()
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await store.uploadSample(props.index, file)
}

// File picker
async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) await store.uploadSample(props.index, file)
  e.target.value = ''
}

function fmt(bytes) {
  if (!bytes) return '—'
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
</script>

<template>
  <li
    class="si"
    :class="{ 'si--dragover': dragOver, 'si--has-file': sample.hasFile }"
    @dragover="onDragover"
    @dragleave="onDragleave"
    @drop="onDrop"
  >
    <!-- Slot number -->
    <span class="si__num">{{ String(index + 1).padStart(2, '0') }}</span>

    <!-- Play button -->
    <button
      class="si__play"
      :class="{ 'si__play--active': playing }"
      :disabled="!sample.hasFile"
      @click="togglePlay"
      :title="playing ? 'Stop' : 'Preview'"
    >
      {{ playing ? '■' : '▶' }}
    </button>

    <!-- Waveform bar (static visual) -->
    <div class="si__wave" :class="{ 'si__wave--empty': !sample.hasFile }">
      <template v-if="sample.hasFile">
        <div
          v-for="i in 32"
          :key="i"
          class="si__wave-bar"
          :style="{ height: `${20 + Math.sin(i * 0.8 + index) * 15 + Math.random() * 5}%` }"
        />
      </template>
    </div>

    <!-- Name -->
    <template v-if="renaming">
      <input
        v-model="renameVal"
        class="si__rename"
        maxlength="16"
        @keydown.enter="commitRename"
        @keydown.escape="renaming = false"
        @blur="commitRename"
        v-focus
      />
    </template>
    <span v-else class="si__name" :class="{ 'si__name--empty': !sample.hasFile }">
      {{ sample.name }}
    </span>

    <!-- Size -->
    <span class="si__size">{{ fmt(sample.size) }}</span>

    <!-- Actions -->
    <div class="si__actions">
      <!-- Upload via file picker -->
      <label class="si__btn" title="Replace sample (WAV/AIFF/MP3)">
        ↑
        <input type="file" accept="audio/*" style="display:none" @change="onFileChange" />
      </label>
      <button class="si__btn" :disabled="!sample.hasFile" title="Download .wav" @click="store.downloadSample(index)">↓</button>
      <button class="si__btn" title="Rename" @click="startRename">✎</button>
      <button class="si__btn si__btn--danger" :disabled="!sample.hasFile" title="Clear slot" @click="store.deleteSample(index)">✕</button>
    </div>
  </li>
</template>

<script>
export default {
  directives: { focus: { mounted: el => el.focus() } }
}
</script>

<style scoped>
.si {
  display: grid;
  grid-template-columns: 24px 24px 80px 1fr 64px auto;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 4px var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 36px;
}

.si:last-child { border-bottom: none; }
.si:hover { background: var(--color-surface-2); }
.si--dragover { box-shadow: inset 0 0 0 2px var(--color-accent); }
.si--has-file .si__num { color: var(--color-success); }

.si__num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: right;
}

.si__play {
  width: 22px;
  height: 22px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.si__play:hover:not(:disabled) {
  border-color: var(--color-success);
  color: var(--color-success);
}

.si__play--active {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #000;
}

.si__play:disabled { opacity: 0.3; cursor: default; }

/* Mini waveform display */
.si__wave {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 1px;
  overflow: hidden;
  flex-shrink: 0;
}

.si__wave--empty {
  background: var(--color-surface-2);
  border-radius: 2px;
}

.si__wave-bar {
  width: 2px;
  background: var(--color-accent);
  opacity: 0.6;
  border-radius: 1px;
  flex-shrink: 0;
}

.si__name {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si__name--empty { color: var(--color-text-muted); font-style: italic; }

.si__rename {
  font-size: 0.85rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: 3px;
  color: var(--color-text);
  outline: none;
  padding: 1px 4px;
  width: 100%;
}

.si__size {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: right;
}

.si__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.si__btn {
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
  padding: 0;
  transition: all var(--transition-fast);
}

.si__btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.si__btn--danger:hover:not(:disabled) {
  border-color: #e84040;
  color: #e84040;
}

.si__btn:disabled { opacity: 0.25; cursor: default; }
</style>
