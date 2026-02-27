import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePatchesStore = defineStore('patches', () => {
  const patches = ref(Array.from({ length: 64 }, (_, i) => ({ name: `Patch ${i + 1}`, index: i, data: null })))
  const activePatchIndex = ref(0)
  const loading = ref(false)

  const activePatch = computed(() => patches.value[activePatchIndex.value])

  async function fetchPatches() {
    loading.value = true
    try {
      const res = await fetch('/api/patches')
      const data = await res.json()
      data.patches.forEach((p, i) => {
        patches.value[i] = p
      })
    } finally {
      loading.value = false
    }
  }

  async function loadPatch(index) {
    activePatchIndex.value = index
    await fetch(`/api/patches/${index}/load`, { method: 'POST' })
  }

  function setPatch(index, data) {
    patches.value[index] = data
  }

  return { patches, activePatchIndex, activePatch, loading, fetchPatches, loadPatch, setPatch }
})
