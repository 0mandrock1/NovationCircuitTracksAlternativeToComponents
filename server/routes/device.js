import { Router } from 'express'
import midiManager from '../midi/MidiManager.js'

const router = Router()

router.get('/ports', (req, res) => {
  const ports = midiManager.getAvailablePorts()
  res.json({ ports })
})

router.post('/connect', (req, res) => {
  const { port } = req.body
  if (!port) return res.status(400).json({ error: 'Port name required' })
  try {
    midiManager.connect(port)
    res.json({ ok: true, port })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/disconnect', (req, res) => {
  midiManager.disconnect()
  res.json({ ok: true })
})

router.get('/status', (req, res) => {
  res.json({
    connected: midiManager.isConnected(),
    port: midiManager.portName
  })
})

// POST /api/device/cc  — send a MIDI CC message
router.post('/cc', (req, res) => {
  const { channel, controller, value } = req.body
  if (!midiManager.isConnected()) return res.status(503).json({ error: 'Device not connected' })
  try {
    midiManager.sendCC(channel, controller, Math.max(0, Math.min(127, value)))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
