import { Router } from 'express'
import midiManager from '../midi/MidiManager.js'
import { buildCurrentPatchDumpRequest } from '../midi/SysExBuilder.js'
import { PATCH_BANK_SIZE } from '../midi/constants.js'

const router = Router()

// In-memory patch storage (will be persisted in later stages)
const patchBank = Array.from({ length: PATCH_BANK_SIZE }, (_, i) => ({
  name: `Patch ${i + 1}`,
  index: i,
  data: null
}))

router.get('/', (req, res) => {
  res.json({ patches: patchBank })
})

router.get('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) {
    return res.status(400).json({ error: 'Invalid patch index' })
  }
  res.json(patchBank[index])
})

router.post('/:index/load', async (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) {
    return res.status(400).json({ error: 'Invalid patch index' })
  }
  if (!midiManager.isConnected()) {
    return res.status(503).json({ error: 'Device not connected' })
  }
  try {
    const request = buildCurrentPatchDumpRequest(0)
    await midiManager.sendSysEx(request)
    res.json({ ok: true, index })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PATCH_BANK_SIZE) {
    return res.status(400).json({ error: 'Invalid patch index' })
  }
  patchBank[index] = { ...patchBank[index], ...req.body, index }
  res.json({ ok: true, patch: patchBank[index] })
})

export default router
