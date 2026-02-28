import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionsStore = defineStore('sessions', () => {
  const projects          = ref(Array.from({ length: 64 }, (_, i) => ({ name: `Project ${i + 1}`, index: i, color: 0 })))
  const activeProject     = ref(null)
  const activeProjectIndex = ref(-1)
  const loading           = ref(false)

  async function fetchProjects() {
    loading.value = true
    try {
      const res  = await fetch('/api/sessions')
      const data = await res.json()
      data.projects.forEach((p, i) => { projects.value[i] = p })
    } finally {
      loading.value = false
    }
  }

  async function selectProject(index) {
    activeProjectIndex.value = index
    const res  = await fetch(`/api/sessions/${index}`)
    activeProject.value = await res.json()
  }

  async function renameProject(index, name) {
    const res  = await fetch(`/api/sessions/${index}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.ok) {
      projects.value[index].name = data.project.name
      if (activeProject.value?.index === index) activeProject.value.name = data.project.name
    }
    return data
  }

  async function copyProject(srcIndex, dstIndex) {
    const res  = await fetch(`/api/sessions/${srcIndex}/copy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetIndex: dstIndex }),
    })
    const data = await res.json()
    if (data.ok) projects.value[dstIndex] = { index: dstIndex, name: data.project.name, color: data.project.color }
    return data
  }

  async function deleteProject(index) {
    await fetch(`/api/sessions/${index}`, { method: 'DELETE' })
    projects.value[index] = { index, name: `Project ${index + 1}`, color: 0 }
    if (activeProjectIndex.value === index) { activeProject.value = null; activeProjectIndex.value = -1 }
  }

  function exportProject(index) {
    const name = projects.value[index]?.name ?? `project_${index}`
    const a    = document.createElement('a')
    a.href     = `/api/sessions/${index}/export`
    a.download = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
    a.click()
  }

  async function importProject(index, file) {
    const text = await file.text()
    let data
    try { data = JSON.parse(text) } catch { return { ok: false, error: 'Invalid JSON file' } }
    const res  = await fetch('/api/sessions/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ index, data }),
    })
    const result = await res.json()
    if (result.ok) {
      projects.value[index].name  = result.project.name
      projects.value[index].color = result.project.color
      if (activeProjectIndex.value === index) activeProject.value = result.project
    }
    return result
  }

  async function renameScene(projectIndex, sceneIndex, name) {
    const res  = await fetch(`/api/sessions/${projectIndex}/scenes/${sceneIndex}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.ok && activeProject.value?.index === projectIndex) {
      activeProject.value.scenes[sceneIndex].name = data.scene.name
    }
    return data
  }

  return {
    projects, activeProject, activeProjectIndex, loading,
    fetchProjects, selectProject,
    renameProject, copyProject, deleteProject,
    exportProject, importProject, renameScene,
  }
})
