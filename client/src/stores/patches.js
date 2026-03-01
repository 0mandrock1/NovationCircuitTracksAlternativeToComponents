import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendSysEx, sendSysExAndWait } from '@/composables/useMidi.js'
import {
  buildRequestPatchDump, buildRequestCurrentPatch, buildReplaceCurrentPatch, buildWritePatch,
  buildPatchDumpMessage, buildBankSyx, parseSyxFile, parseSysEx, decodePatchName,
} from '@/midi/sysex.js'
import { CMD_PATCH_DUMP, CMD_CURRENT_PATCH_DUMP, SYNTH_TRACK_1, SYNTH_TRACK_2, SYSEX_MIN_DELAY_MS } from '@/midi/constants.js'

const FETCH_ONE_TIMEOUT_MS = 3000

function _emptySlot(index) {
  return { index, name: `Patch ${index + 1}`, hasData: false, params: null, rawBytes: null }
}

function _synthTrack(track) {
  return track === 0 ? SYNTH_TRACK_1 : SYNTH_TRACK_2
}

function _blobDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function _emptyProgress() {
  return { done: 0, total: 64, failed: 0 }
}

export const usePatchesStore = defineStore('patches', () => {
  const activeTrack      = ref(0)
  const activePatchIndex = ref(0)
  const fetchingAll      = ref(false)
  const sendingAll       = ref(false)
  const fetchProgress    = ref(_emptyProgress())
  const sendProgress     = ref(_emptyProgress())
  const error            = ref(null)

  let _cancelFetch = false
  let _cancelSend  = false

  const patches = ref({
    0: Array.from({ length: 64 }, (_, i) => _emptySlot(i)),
    1: Array.from({ length: 64 }, (_, i) => _emptySlot(i)),
  })

  const activePatch = computed(() => patches.value[activeTrack.value][activePatchIndex.value])

  // ── Fetch from device ────────────────────────────────────────────────────────

  async function fetchFromDevice(index, timeout = FETCH_ONE_TIMEOUT_MS) {
    try {
      const raw    = await sendSysExAndWait(buildRequestPatchDump(index), CMD_PATCH_DUMP, timeout)
      const parsed = parseSysEx(raw)
      if (parsed?.type === 'patchDump') {
        patches.value[activeTrack.value][index] = {
          index, name: parsed.params.name, hasData: true,
          params: parsed.params, rawBytes: parsed.rawBytes,
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function fetchAllFromDevice() {
    fetchingAll.value = true
    _cancelFetch      = false
    fetchProgress.value = _emptyProgress()
    fetchProgress.value.total = 64
    error.value = null

    try {
      for (let i = 0; i < 64; i++) {
        if (_cancelFetch) break
        const ok = await fetchFromDevice(i, FETCH_ONE_TIMEOUT_MS)
        if (!ok) fetchProgress.value.failed++
        fetchProgress.value.done = i + 1
        if (i < 63 && !_cancelFetch) await new Promise(r => setTimeout(r, SYSEX_MIN_DELAY_MS))
      }
    } finally {
      fetchingAll.value = false
    }
  }

  function cancelFetchAll() { _cancelFetch = true }

  /** Fetch whatever patch is currently active on the device (alternative to indexed fetch). */
  async function fetchCurrentPatch() {
    try {
      const raw    = await sendSysExAndWait(
        buildRequestCurrentPatch(_synthTrack(activeTrack.value)),
        CMD_CURRENT_PATCH_DUMP,
        FETCH_ONE_TIMEOUT_MS
      )
      const parsed = parseSysEx(raw)
      if (parsed?.type === 'currentPatchDump') {
        const index = activePatchIndex.value
        patches.value[activeTrack.value][index] = {
          index, name: parsed.params.name, hasData: true,
          params: parsed.params, rawBytes: parsed.rawBytes,
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // ── Send to device ───────────────────────────────────────────────────────────

  /** Audition (replace current patch, no bank write). */
  async function sendToDevice(index) {
    activePatchIndex.value = index
    const slot = patches.value[activeTrack.value][index]
    if (!slot?.rawBytes) return
    await sendSysEx(buildReplaceCurrentPatch(slot.rawBytes, _synthTrack(activeTrack.value)))
  }

  /** Write patch to its bank slot on the device. */
  async function writeToDevice(index) {
    const slot = patches.value[activeTrack.value][index]
    if (!slot?.rawBytes) return
    await sendSysEx(buildWritePatch(slot.rawBytes, index))
  }

  /** Write all patches that have data to the device bank. */
  async function sendAllToDevice() {
    sendingAll.value = true
    _cancelSend      = false
    sendProgress.value = _emptyProgress()
    sendProgress.value.total = 64
    error.value = null

    try {
      for (let i = 0; i < 64; i++) {
        if (_cancelSend) break
        const slot = patches.value[activeTrack.value][i]
        if (slot?.rawBytes) {
          try {
            await sendSysEx(buildWritePatch(slot.rawBytes, i))
          } catch {
            sendProgress.value.failed++
          }
          await new Promise(r => setTimeout(r, SYSEX_MIN_DELAY_MS))
        }
        sendProgress.value.done = i + 1
      }
    } finally {
      sendingAll.value = false
    }
  }

  function cancelSendAll() { _cancelSend = true }

  // ── Import / Export ──────────────────────────────────────────────────────────

  function exportPatchSyx(index) {
    const slot = patches.value[activeTrack.value][index]
    if (!slot?.rawBytes) return
    const name  = slot.name ?? `patch_${index}`
    _blobDownload(
      new Uint8Array(buildPatchDumpMessage(slot.rawBytes, index)),
      `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.syx`
    )
  }

  function exportBankSyx() {
    _blobDownload(
      buildBankSyx(patches.value[activeTrack.value].map(p => p.rawBytes)),
      `circuit_tracks_synth${activeTrack.value + 1}_bank.syx`
    )
  }

  async function importSyx(file) {
    error.value = null
    try {
      const parsed = parseSyxFile(new Uint8Array(await file.arrayBuffer()))
      if (!parsed.length) { error.value = 'No valid patches found in file'; return { ok: false } }
      for (const { patchIndex, rawBytes } of parsed) {
        patches.value[activeTrack.value][patchIndex] = {
          index: patchIndex, name: decodePatchName(rawBytes), hasData: true, params: null, rawBytes,
        }
      }
      return { ok: true, count: parsed.length }
    } catch (e) {
      error.value = e.message
      return { ok: false }
    }
  }

  function renamePatch(index, name) {
    const slot = patches.value[activeTrack.value][index]
    if (slot) slot.name = name
  }

  function deletePatch(index) {
    patches.value[activeTrack.value][index] = _emptySlot(index)
  }

  return {
    patches, activeTrack, activePatchIndex, activePatch,
    fetchingAll, sendingAll, fetchProgress, sendProgress, error,
    fetchFromDevice, fetchAllFromDevice, cancelFetchAll, fetchCurrentPatch,
    sendToDevice, writeToDevice, sendAllToDevice, cancelSendAll,
    exportPatchSyx, exportBankSyx, importSyx,
    renamePatch, deletePatch,
  }
})
