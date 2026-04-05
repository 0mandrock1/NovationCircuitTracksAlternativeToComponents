import { defineStore } from 'pinia'
import { ref } from 'vue'

function _emptySlot(index) {
  return {
    index,
    name:      `Sample ${index + 1}`,
    filename:  null,
    size:      0,
    audioUrl:  null,   // Object URL for local playback
    buffer:    null,   // ArrayBuffer of raw file data
  }
}

export const useSamplesStore = defineStore('samples', () => {
  const samples = ref(Array.from({ length: 64 }, (_, i) => _emptySlot(i)))
  const loading = ref(false)

  /** Load a local audio file into a slot (no server needed). */
  async function loadFile(index, file) {
    const buffer = await file.arrayBuffer()
    if (samples.value[index].audioUrl) URL.revokeObjectURL(samples.value[index].audioUrl)
    const audioUrl = URL.createObjectURL(new Blob([buffer], { type: file.type }))
    samples.value[index] = {
      ...samples.value[index],
      name:     file.name.replace(/\.[^.]+$/, '').slice(0, 16),
      filename: file.name,
      size:     file.size,
      audioUrl,
      buffer,
    }
  }

  function renameSample(index, name) {
    const trimmed = name.slice(0, 16)
    samples.value[index].name = trimmed
    fetch(`/api/samples/${index}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    }).catch(() => {})
  }

  function deleteSample(index) {
    if (samples.value[index].audioUrl) URL.revokeObjectURL(samples.value[index].audioUrl)
    samples.value[index] = _emptySlot(index)
    fetch(`/api/samples/${index}`, { method: 'DELETE' }).catch(() => {})
  }

  function exportSample(index) {
    const s = samples.value[index]
    if (!s.buffer) return
    const blob = new Blob([s.buffer], { type: 'audio/wav' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = s.filename ?? `${s.name}.wav`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /** Fetch sample list from server and populate slots that have server-side files. */
  async function loadFromServer() {
    try {
      const res  = await fetch('/api/samples')
      if (!res.ok) return
      const { samples: list } = await res.json()
      for (const s of list) {
        if (s.index >= 0 && s.index < 64 && s.filename) {
          // Only update slots that are not already populated with a local file
          const slot = samples.value[s.index]
          if (!slot.audioUrl) {
            slot.name     = s.name
            slot.filename = s.filename
            slot.size     = s.size
          }
        }
      }
    } catch { /* server unavailable */ }
  }

  return { samples, loading, loadFile, renameSample, deleteSample, exportSample, loadFromServer }
})
