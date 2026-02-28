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

// ── Global settings ──────────────────────────────────────────────────────────

// POST /api/device/tempo — set tempo via MIDI CC or SysEx
// Circuit Tracks: tempo is set via SysEx; this sends a CC placeholder (CC 0x51 on ch 0)
router.post('/tempo', (req, res) => {
  const bpm = Number(req.body.bpm)
  if (!bpm || bpm < 40 || bpm > 240) return res.status(400).json({ error: 'BPM must be 40–240' })
  try {
    // Map 40-240 BPM → 0-127 for CC (best-effort without full SysEx implementation)
    const ccVal = Math.round((bpm - 40) * 127 / 200)
    midiManager.sendCC(0, 0x51, ccVal)
    res.json({ ok: true, bpm })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

// POST /api/device/swing — set swing amount
// Circuit Tracks: swing via CC (CC 0x52 on ch 0, 0 = no swing, 127 = max)
router.post('/swing', (req, res) => {
  const amount = Number(req.body.amount)
  if (amount === undefined || amount < 0 || amount > 100) return res.status(400).json({ error: 'Swing must be 0–100' })
  try {
    const ccVal = Math.round(amount * 127 / 100)
    midiManager.sendCC(0, 0x52, ccVal)
    res.json({ ok: true, amount })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

// POST /api/device/transpose — set global transpose (-12 to +12 semitones)
// Sends CC 0x53 on ch 0: 0 = -12, 64 = 0, 127 = +12
router.post('/transpose', (req, res) => {
  const semitones = Number(req.body.semitones)
  if (semitones === undefined || semitones < -12 || semitones > 12) {
    return res.status(400).json({ error: 'Semitones must be −12 to +12' })
  }
  try {
    const ccVal = Math.round((semitones + 12) * 127 / 24)
    midiManager.sendCC(0, 0x53, ccVal)
    res.json({ ok: true, semitones })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

export default router
