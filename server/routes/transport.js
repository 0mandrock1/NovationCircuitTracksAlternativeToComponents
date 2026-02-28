import { Router } from 'express'
import midiManager from '../midi/MidiManager.js'

const router = Router()

// POST /api/transport/play — send MIDI Start (0xFA)
router.post('/play', (req, res) => {
  try {
    midiManager.sendStart()
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

// POST /api/transport/stop — send MIDI Stop (0xFC)
router.post('/stop', (req, res) => {
  try {
    midiManager.sendStop()
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

// POST /api/transport/continue — send MIDI Continue (0xFB)
router.post('/continue', (req, res) => {
  try {
    midiManager.sendContinue()
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

export default router
