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
    sending:   false,
    fetching:  false,
  }
}

function _emptyProgress() {
  return { done: 0, total: 64, failed: 0 }
}

export const useSamplesStore = defineStore('samples', () => {
  const samples     = ref(Array.from({ length: 64 }, (_, i) => _emptySlot(i)))
  const loading     = ref(false)
  const sendingAll  = ref(false)
  const fetchingAll = ref(false)
  const sendProgress  = ref(_emptyProgress())
  const fetchProgress = ref(_emptyProgress())

  let _cancelSend  = false
  let _cancelFetch = false

  // ── Local file operations ─────────────────────────────────────────────────

  /** Load a local audio file into a slot (no server needed). */
  async function loadFile(index, file) {
    const buffer = await file.arrayBuffer()
    // Revoke previous URL
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

  // ── Server-assisted device operations ────────────────────────────────────
  // These call the REST server (which handles SysEx transfer).
  // If the server is not available, they show an error gracefully.

  async function fetchFromDevice(index) {
    samples.value[index].fetching = true
    try {
      const res = await fetch(`/api/samples/${index}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      if (data.sample) {
        samples.value[index] = {
          ...samples.value[index],
          name:     data.sample.name ?? samples.value[index].name,
          filename: data.sample.filename,
          size:     data.sample.size ?? 0,
          fetching: false,
        }
      }
      return true
    } catch {
      return false
    } finally {
      samples.value[index].fetching = false
    }
  }

  async function sendToDevice(index) {
    const s = samples.value[index]
    if (!s.buffer && !s.filename) return false
    samples.value[index].sending = true
    try {
      const blob     = s.buffer ? new Blob([s.buffer], { type: 'audio/wav' }) : null
      const formData = new FormData()
      if (blob) formData.append('file', blob, s.filename ?? `${s.name}.wav`)
      const res  = await fetch(`/api/samples/${index}/send`, { method: 'POST', body: formData })
      return res.ok
    } catch {
      return false
    } finally {
      samples.value[index].sending = false
    }
  }

  async function fetchAllFromDevice() {
    fetchingAll.value = true
    _cancelFetch      = false
    fetchProgress.value = { done: 0, total: 64, failed: 0 }
    try {
      for (let i = 0; i < 64; i++) {
        if (_cancelFetch) break
        const ok = await fetchFromDevice(i)
        if (!ok) fetchProgress.value.failed++
        fetchProgress.value.done = i + 1
      }
    } finally {
      fetchingAll.value = false
    }
  }

  async function sendAllToDevice() {
    sendingAll.value = true
    _cancelSend      = false
    sendProgress.value = { done: 0, total: 64, failed: 0 }
    try {
      for (let i = 0; i < 64; i++) {
        if (_cancelSend) break
        if (samples.value[i].buffer || samples.value[i].filename) {
          const ok = await sendToDevice(i)
          if (!ok) sendProgress.value.failed++
        }
        sendProgress.value.done = i + 1
      }
    } finally {
      sendingAll.value = false
    }
  }

  function cancelFetchAll() { _cancelFetch = true }
  function cancelSendAll()  { _cancelSend  = true }

  return {
    samples, loading, sendingAll, fetchingAll, sendProgress, fetchProgress,
    loadFile, renameSample, deleteSample, exportSample,
    fetchFromDevice, sendToDevice, fetchAllFromDevice, sendAllToDevice,
    cancelFetchAll, cancelSendAll,
  }
})
