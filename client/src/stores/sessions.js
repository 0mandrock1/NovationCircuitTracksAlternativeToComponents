import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionsStore = defineStore('sessions', () => {
  const projects = ref(Array.from({ length: 64 }, (_, i) => ({ name: `Project ${i + 1}`, index: i, color: 0 })))
  const packs = ref(Array.from({ length: 32 }, (_, i) => ({ name: `Pack ${i + 1}`, index: i })))
  const activeProjectIndex = ref(0)
  const loading = ref(false)

  async function fetchProjects() {
    loading.value = true
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      data.projects.forEach((p, i) => {
        projects.value[i] = p
      })
    } finally {
      loading.value = false
    }
  }

  function setProject(index, data) {
    projects.value[index] = data
  }

  return { projects, packs, activeProjectIndex, loading, fetchProjects, setProject }
})
