import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSamplesStore = defineStore('samples', () => {
  const samples = ref(Array.from({ length: 64 }, (_, i) => ({ name: `Sample ${i + 1}`, index: i, size: 0 })))
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

  function setSample(index, data) {
    samples.value[index] = data
  }

  return { samples, loading, fetchSamples, setSample }
})
