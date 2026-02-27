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

export default router
