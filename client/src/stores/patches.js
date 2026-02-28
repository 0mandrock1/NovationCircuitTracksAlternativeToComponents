import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDeviceStore } from '@/stores/device'

function _emptySlot(index) {
  return { index, name: `Patch ${index + 1}`, hasData: false, params: null }
}

export const usePatchesStore = defineStore('patches', () => {
  // 0 = Synth 1, 1 = Synth 2
  const activeTrack      = ref(0)
  const activePatchIndex = ref(0)
  const loading          = ref(false)
  const fetchingAll      = ref(false)
  const error            = ref(null)

  // patches[track][index]
  const patches = ref({
    0: Array.from({ length: 64 }, (_, i) => _emptySlot(i)),
    1: Array.from({ length: 64 }, (_, i) => _emptySlot(i)),
  })

  const activePatch = computed(() => patches.value[activeTrack.value][activePatchIndex.value])

  function _tq() { return `track=${activeTrack.value}` }

  async function fetchPatches() {
    loading.value = true
    error.value   = null
    try {
      const res  = await fetch(`/api/patches?${_tq()}`)
      const data = await res.json()
      data.patches.forEach(p => { patches.value[activeTrack.value][p.index] = p })
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchFromDevice(index) {
    const res  = await fetch(`/api/patches/${index}/fetch?${_tq()}`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) patches.value[activeTrack.value][index] = { ...data.patch, hasData: true }
    return data
  }

  async function fetchAllFromDevice() {
    fetchingAll.value = true
    error.value       = null
    try {
      const res  = await fetch(`/api/patches/fetch-all?${_tq()}`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) await fetchPatches()
      return data
    } catch (e) {
      error.value = e.message
    } finally {
      fetchingAll.value = false
    }
  }

  async function sendToDevice(index) {
    activePatchIndex.value = index
    useDeviceStore().recordMidiOut()
    return (await fetch(`/api/patches/${index}/send?${_tq()}`, { method: 'POST' })).json()
  }

  // PUT updated params to server (rebuilds rawBytes), then audition on device
  async function updateAndSendParams(index) {
    const params = patches.value[activeTrack.value][index]?.params
    if (!params) return
    await fetch(`/api/patches/${index}?${_tq()}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ params }),
    })
    return sendToDevice(index)
  }

  async function writePatchToDevice(index) {
    return (await fetch(`/api/patches/${index}/write?${_tq()}`, { method: 'POST' })).json()
  }

  function exportPatchSyx(index) {
    const name = patches.value[activeTrack.value][index]?.name ?? `patch_${index}`
    const a = document.createElement('a')
    a.href     = `/api/patches/${index}/export?${_tq()}`
    a.download = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.syx`
    a.click()
  }

  function exportBankSyx() {
    const a = document.createElement('a')
    a.href     = `/api/patches/export?${_tq()}`
    a.download = `circuit_tracks_synth${activeTrack.value + 1}_bank.syx`
    a.click()
  }

  async function importSyx(file) {
    const buffer = await file.arrayBuffer()
    const bytes  = new Uint8Array(buffer)
    // Convert to base64 in chunks to avoid call-stack overflow on large files
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)

    const res  = await fetch('/api/patches/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: base64, track: activeTrack.value }),
    })
    const data = await res.json()
    if (data.ok) await fetchPatches()
    return data
  }

  async function renamePatch(index, name) {
    const res  = await fetch(`/api/patches/${index}?${_tq()}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.ok) patches.value[activeTrack.value][index].name = data.name
    return data
  }

  async function deletePatch(index) {
    await fetch(`/api/patches/${index}?${_tq()}`, { method: 'DELETE' })
    patches.value[activeTrack.value][index] = _emptySlot(index)
  }

  // Called by WebSocket handler
  function handleWsPatchUpdate(msg) {
    if (patches.value[msg.track]?.[msg.index]) {
      Object.assign(patches.value[msg.track][msg.index], { name: msg.name, params: msg.params, hasData: true })
    }
  }

  function handleWsCurrentDump(msg) {
    if (msg.params) {
      const slot = patches.value[activeTrack.value][activePatchIndex.value]
      Object.assign(slot, { params: msg.params, hasData: true })
    }
  }

  return {
    patches, activeTrack, activePatchIndex, activePatch,
    loading, fetchingAll, error,
    fetchPatches, fetchFromDevice, fetchAllFromDevice,
    sendToDevice, writePatchToDevice, updateAndSendParams,
    exportPatchSyx, exportBankSyx, importSyx,
    renamePatch, deletePatch,
    handleWsPatchUpdate, handleWsCurrentDump,
  }
})
