import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSamplesStore = defineStore('samples', () => {
  const samples = ref(Array.from({ length: 64 }, (_, i) => ({ name: `Sample ${i + 1}`, index: i, size: 0, filename: null })))
  const loading = ref(false)

  async function fetchSamples() {
    loading.value = true
    try {
      const res = await fetch('/api/samples')
      const data = await res.json()
      data.samples.forEach((s, i) => {
        samples.value[i] = s
      })
    } finally {
      loading.value = false
    }
  }

  async function renameSample(index, name) {
    const res = await fetch(`/api/samples/${index}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (data.ok) samples.value[index] = data.sample
  }

  async function uploadSample(index, file) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/samples/${index}/upload`, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.ok) samples.value[index] = data.sample
    return data
  }

  async function deleteSample(index) {
    const res = await fetch(`/api/samples/${index}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      samples.value[index] = { name: `Sample ${index + 1}`, index, size: 0, filename: null }
    }
  }

  function setSample(index, data) {
    samples.value[index] = data
  }

  return { samples, loading, fetchSamples, renameSample, uploadSample, deleteSample, setSample }
})
