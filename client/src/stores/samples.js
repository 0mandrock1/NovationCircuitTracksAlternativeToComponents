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
    samples.value[index].name = name.slice(0, 16)
  }

  function deleteSample(index) {
    if (samples.value[index].audioUrl) URL.revokeObjectURL(samples.value[index].audioUrl)
    samples.value[index] = _emptySlot(index)
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

  return { samples, loading, loadFile, renameSample, deleteSample, exportSample }
})
