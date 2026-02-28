import { Router } from 'express'
import midiManager from '../midi/MidiManager.js'
import {
  buildRequestCurrentPatch,
  buildRequestPatchDump,
  buildReplaceCurrentPatch,
  buildWritePatch,
  buildBankSyx,
  buildPatchDumpMessage,
  parseSyxFile,
  defaultPatchBytes,
  decodePatchName,
  rawBytesToParams,
  paramsToBytesPartial,
} from '../midi/SysExBuilder.js'
import { parseSysEx } from '../midi/SysExParser.js'
import {
  PATCH_BANK_SIZE,
  CMD_PATCH_DUMP,
  SYNTH_TRACK_1,
  SYNTH_TRACK_2,
} from '../midi/constants.js'

const router = Router()

// ── In-memory patch banks (one per synth track) ───────────────────────────────
// banks[0] = Synth 1,  banks[1] = Synth 2
const banks = {
  0: Array.from({ length: PATCH_BANK_SIZE }, (_, i) => _emptySlot(i)),
  1: Array.from({ length: PATCH_BANK_SIZE }, (_, i) => _emptySlot(i)),
}

function _emptySlot(index) {
  return { index, name: `Patch ${index + 1}`, rawBytes: null, params: null }
}

function _slotFromRaw(rawBytes, index) {
  const raw = Array.from(rawBytes)
  return { index, rawBytes: raw, name: decodePatchName(raw), params: rawBytesToParams(raw) }
}

function _track(req) {
  const t = parseInt(req.query.track ?? req.body?.track ?? '0', 10)
  return t === 1 ? 1 : 0
}

function _synthSelector(track) {
  return track === 1 ? SYNTH_TRACK_2 : SYNTH_TRACK_1
}

// ── GET /api/patches ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const track = _track(req)
  res.json({
    track,
    patches: banks[track].map(p => ({
      index:   p.index,
      name:    p.name,
      hasData: p.rawBytes !== null,
    })),
  })
})

// ── GET /api/patches/export  (must be before /:index) ────────────────────────
router.get('/export', (req, res) => {
  const track    = _track(req)
  const rawBanks = banks[track].map(s => s.rawBytes)
  const syx      = buildBankSyx(rawBanks)
  const label    = track === 1 ? 'synth2' : 'synth1'

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="circuit_tracks_${label}_bank.syx"`)
  res.send(Buffer.from(syx))
})

// ── GET /api/patches/:index ───────────────────────────────────────────────────
router.get('/:index', (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })
  const s = banks[track][index]
  res.json({ index: s.index, name: s.name, params: s.params, hasData: s.rawBytes !== null })
})

// ── GET /api/patches/:index/export  — single patch as .syx ───────────────────
router.get('/:index/export', (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })

  const s        = banks[track][index]
  const raw      = s.rawBytes ?? defaultPatchBytes(index)
  const syx      = buildPatchDumpMessage(raw, index)
  const safeName = s.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || `patch_${index}`

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.syx"`)
  res.send(Buffer.from(syx))
})

// ── POST /api/patches/:index/send  — audition patch on device ────────────────
router.post('/:index/send', async (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })
  if (!midiManager.isConnected()) return res.status(503).json({ error: 'Device not connected' })

  const raw = banks[track][index].rawBytes ?? defaultPatchBytes(index)
  try {
    await midiManager.sendSysEx(buildReplaceCurrentPatch(raw, _synthSelector(track)))
    res.json({ ok: true, index, name: banks[track][index].name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/patches/:index/write  — write patch to device bank slot ─────────
router.post('/:index/write', async (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })
  if (!midiManager.isConnected()) return res.status(503).json({ error: 'Device not connected' })

  const raw = banks[track][index].rawBytes ?? defaultPatchBytes(index)
  try {
    await midiManager.sendSysEx(buildWritePatch(raw, index))
    res.json({ ok: true, index, name: banks[track][index].name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/patches/:index/fetch  — request single patch dump from device ───
router.post('/:index/fetch', async (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })
  if (!midiManager.isConnected()) return res.status(503).json({ error: 'Device not connected' })

  try {
    const resp   = await midiManager.sendSysExAndWait(buildRequestPatchDump(index), CMD_PATCH_DUMP)
    const parsed = parseSysEx(resp)
    if (!parsed || parsed.type !== 'patchDump') return res.status(500).json({ error: 'Unexpected SysEx response' })
    banks[track][index] = _slotFromRaw(parsed.rawBytes, index)
    res.json({ ok: true, patch: { index, name: banks[track][index].name, params: banks[track][index].params } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/patches/fetch-all  — request full bank dump from device ─────────
router.post('/fetch-all', async (req, res) => {
  const track = _track(req)
  if (!midiManager.isConnected()) return res.status(503).json({ error: 'Device not connected' })

  const results = []
  for (let i = 0; i < PATCH_BANK_SIZE; i++) {
    try {
      const resp   = await midiManager.sendSysExAndWait(buildRequestPatchDump(i), CMD_PATCH_DUMP)
      const parsed = parseSysEx(resp)
      if (parsed?.type === 'patchDump') {
        banks[track][i] = _slotFromRaw(parsed.rawBytes, i)
        results.push({ index: i, name: banks[track][i].name, ok: true })
      } else {
        results.push({ index: i, ok: false, error: 'Bad response' })
      }
    } catch (err) {
      results.push({ index: i, ok: false, error: err.message })
      break  // stop on first timeout
    }
  }
  res.json({ ok: true, results })
})

// ── PUT /api/patches/:index  — update name or rawBytes ───────────────────────
router.put('/:index', (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })

  const s = banks[track][index]
  if (req.body.name !== undefined) s.name = String(req.body.name).slice(0, 16)
  if (req.body.rawBytes !== undefined) {
    s.rawBytes = Array.from(req.body.rawBytes)
    s.params   = rawBytesToParams(s.rawBytes)
    s.name     = decodePatchName(s.rawBytes)
  }
  if (req.body.params !== undefined) {
    const existing = s.rawBytes ?? Array.from(defaultPatchBytes(index))
    s.rawBytes = Array.from(paramsToBytesPartial(req.body.params, existing))
    s.params   = rawBytesToParams(s.rawBytes)
  }
  res.json({ ok: true, index, name: s.name })
})

// ── DELETE /api/patches/:index  — clear a slot ───────────────────────────────
router.delete('/:index', (req, res) => {
  const track = _track(req)
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) return res.status(400).json({ error: 'Invalid patch index' })
  banks[track][index] = _emptySlot(index)
  res.json({ ok: true })
})

// ── POST /api/patches/import  — import .syx file (base64 JSON body) ──────────
router.post('/import', (req, res) => {
  const track = _track(req)
  const { data } = req.body
  if (!data) return res.status(400).json({ error: 'Missing data field (base64 bytes)' })

  let fileBytes
  try {
    fileBytes = Buffer.from(data, 'base64')
  } catch {
    return res.status(400).json({ error: 'Invalid base64 data' })
  }

  const parsed = parseSyxFile(fileBytes)
  if (!parsed.length) return res.status(400).json({ error: 'No valid Circuit Tracks patches found in .syx file' })

  const imported = []
  for (const { patchIndex, rawBytes } of parsed) {
    if (patchIndex < 0 || patchIndex >= PATCH_BANK_SIZE) continue
    banks[track][patchIndex] = _slotFromRaw(rawBytes, patchIndex)
    imported.push({ index: patchIndex, name: banks[track][patchIndex].name })
  }

  res.json({ ok: true, count: imported.length, patches: imported })
})

export { banks }
export default router
