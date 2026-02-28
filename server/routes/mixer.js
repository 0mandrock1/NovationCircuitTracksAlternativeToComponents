import { Router } from 'express'
import midiManager from '../midi/MidiManager.js'

const router = Router()

// POST /api/mixer/cc — send a single MIDI CC message to the device
router.post('/cc', (req, res) => {
  const { channel, controller, value } = req.body
  if (channel === undefined || controller === undefined || value === undefined) {
    return res.status(400).json({ error: 'channel, controller, value required' })
  }
  try {
    midiManager.sendCC(Number(channel), Number(controller), Number(value))
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

export default router
