import { Router } from 'express'
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, statSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dir    = dirname(fileURLToPath(import.meta.url))
const STORAGE  = join(__dir, '../storage/samples')

mkdirSync(STORAGE, { recursive: true })

const router = Router()

// In-memory metadata for 64 slots
const bank = Array.from({ length: 64 }, (_, i) => _emptySlot(i))

function _emptySlot(index) {
  return { index, name: `Sample ${index + 1}`, filename: null, size: 0 }
}

function _clearFile(slot) {
  if (!slot.filename) return
  const p = join(STORAGE, slot.filename)
  if (existsSync(p)) try { unlinkSync(p) } catch {}
}

async function _ffmpegAvailable() {
  try { await execAsync('ffmpeg -version'); return true } catch { return false }
}

// ── GET /api/samples  — list ──────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    samples: bank.map(s => ({
      index: s.index, name: s.name, size: s.size, hasFile: !!s.filename
    }))
  })
})

// ── GET /api/samples/:index ───────────────────────────────────────────────────
router.get('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) return res.status(400).json({ error: 'Invalid index' })
  const s = bank[index]
  res.json({ index: s.index, name: s.name, size: s.size, hasFile: !!s.filename })
})

// ── GET /api/samples/:index/stream  — stream WAV for browser preview ──────────
router.get('/:index/stream', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) return res.status(400).json({ error: 'Invalid index' })
  const s = bank[index]
  if (!s.filename) return res.status(404).json({ error: 'No file' })
  const p = join(STORAGE, s.filename)
  if (!existsSync(p)) return res.status(404).json({ error: 'File missing' })
  res.setHeader('Content-Type', 'audio/wav')
  res.setHeader('Accept-Ranges', 'bytes')
  res.send(readFileSync(p))
})

// ── GET /api/samples/:index/download  — force download ───────────────────────
router.get('/:index/download', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) return res.status(400).json({ error: 'Invalid index' })
  const s = bank[index]
  if (!s.filename) return res.status(404).json({ error: 'No file' })
  const p = join(STORAGE, s.filename)
  if (!existsSync(p)) return res.status(404).json({ error: 'File missing' })
  const safe = s.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || `sample_${index}`
  res.setHeader('Content-Type', 'audio/wav')
  res.setHeader('Content-Disposition', `attachment; filename="${safe}.wav"`)
  res.send(readFileSync(p))
})

// ── POST /api/samples/:index/upload  — upload audio file (base64 JSON) ────────
router.post('/:index/upload', async (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) return res.status(400).json({ error: 'Invalid index' })

  const { data, filename: origName = 'sample' } = req.body
  if (!data) return res.status(400).json({ error: 'Missing data (base64)' })

  const ext     = extname(origName).toLowerCase() || '.wav'
  const tmpFile = `tmp_${index}_${Date.now()}${ext}`
  const tmpPath = join(STORAGE, tmpFile)

  try {
    writeFileSync(tmpPath, Buffer.from(data, 'base64'))
  } catch {
    return res.status(500).json({ error: 'Failed to write temporary file' })
  }

  const outFile = `${String(index).padStart(2, '0')}_${Date.now()}.wav`
  const outPath = join(STORAGE, outFile)
  const hasFFmpeg = await _ffmpegAvailable()
  let converted = false

  if (hasFFmpeg) {
    try {
      await execAsync(`ffmpeg -y -i "${tmpPath}" -ar 48000 -ac 1 -acodec pcm_s16le "${outPath}"`)
      converted = true
    } catch (err) {
      try { unlinkSync(tmpPath) } catch {}
      return res.status(500).json({ error: `Audio conversion failed: ${err.message}` })
    }
  } else {
    // No ffmpeg — store as-is (file may not be 48 kHz, but still usable for preview)
    writeFileSync(outPath, readFileSync(tmpPath))
  }

  try { unlinkSync(tmpPath) } catch {}

  // Remove old file for this slot
  _clearFile(bank[index])

  const stat = statSync(outPath)
  const name = origName.replace(/\.[^.]+$/, '').slice(0, 16) || bank[index].name
  bank[index] = { index, name, filename: outFile, size: stat.size }

  res.json({ ok: true, index, name, size: stat.size, converted })
})

// ── PUT /api/samples/:index  — rename ────────────────────────────────────────
router.put('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) return res.status(400).json({ error: 'Invalid index' })
  if (req.body.name !== undefined) bank[index].name = String(req.body.name).slice(0, 16)
  res.json({ ok: true, index, name: bank[index].name })
})

// ── DELETE /api/samples/:index  — clear slot ─────────────────────────────────
router.delete('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) return res.status(400).json({ error: 'Invalid index' })
  _clearFile(bank[index])
  bank[index] = _emptySlot(index)
  res.json({ ok: true })
})

export default router
