import { defineStore } from 'pinia'
import { ref } from 'vue'

function _empty(index) {
  return { index, name: `Sample ${index + 1}`, size: 0, hasFile: false }
}

export const useSamplesStore = defineStore('samples', () => {
  const samples  = ref(Array.from({ length: 64 }, (_, i) => _empty(i)))
  const loading  = ref(false)
  const error    = ref(null)

  async function fetchSamples() {
    loading.value = true
    error.value   = null
    try {
      const res  = await fetch('/api/samples')
      const data = await res.json()
      data.samples.forEach(s => { samples.value[s.index] = s })
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function uploadSample(index, file) {
    const buffer = await file.arrayBuffer()
    const bytes  = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)

    const res  = await fetch(`/api/samples/${index}/upload`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: base64, filename: file.name }),
    })
    const data = await res.json()
    if (data.ok) {
      samples.value[index] = { index, name: data.name, size: data.size, hasFile: true }
    }
    return data
  }

  async function renameSample(index, name) {
    const res  = await fetch(`/api/samples/${index}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.ok) samples.value[index].name = data.name
    return data
  }

  async function deleteSample(index) {
    await fetch(`/api/samples/${index}`, { method: 'DELETE' })
    samples.value[index] = _empty(index)
  }

  function downloadSample(index) {
    const s = samples.value[index]
    const a = document.createElement('a')
    a.href     = `/api/samples/${index}/download`
    a.download = `${s.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.wav`
    a.click()
  }

  function streamUrl(index) {
    return `/api/samples/${index}/stream?t=${Date.now()}`
  }

  return {
    samples, loading, error,
    fetchSamples, uploadSample, renameSample, deleteSample, downloadSample, streamUrl,
  }
})
