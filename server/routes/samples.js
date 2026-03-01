import { Router } from 'express'
import multer from 'multer'
import { join, extname } from 'path'
import { existsSync, mkdirSync, unlinkSync, renameSync, statSync, createReadStream } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { spawn } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SAMPLES_DIR = join(__dirname, '../../data/samples')

if (!existsSync(SAMPLES_DIR)) {
  mkdirSync(SAMPLES_DIR, { recursive: true })
}

function convertWithFfmpeg(src, dst) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-y', '-i', src, '-ar', '48000', '-ac', '1', '-sample_fmt', 's16', dst])
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited with code ${code}`))
    })
    proc.on('error', reject)
  })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SAMPLES_DIR),
  filename: (req, file, cb) => {
    const index = req.params.index
    const ext = extname(file.originalname) || '.wav'
    cb(null, `sample_${index}_src${ext}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.wav', '.aiff', '.aif', '.mp3']
    const ext = extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
  limits: { fileSize: 50 * 1024 * 1024 }
})

const router = Router()

const sampleBank = Array.from({ length: 64 }, (_, i) => ({
  name: `Sample ${i + 1}`,
  index: i,
  size: 0,
  filename: null
}))

router.get('/', (req, res) => {
  res.json({ samples: sampleBank })
})

router.get('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  res.json(sampleBank[index])
})

router.get('/:index/audio', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  const sample = sampleBank[index]
  if (!sample.filename) {
    return res.status(404).json({ error: 'No audio file for this sample' })
  }
  const filePath = join(SAMPLES_DIR, sample.filename)
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' })
  }
  const ext = extname(sample.filename).toLowerCase()
  const contentTypes = { '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.aiff': 'audio/aiff', '.aif': 'audio/aiff' }
  res.setHeader('Content-Type', contentTypes[ext] || 'audio/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${sample.name}${ext}"`)
  createReadStream(filePath).pipe(res)
})

router.get('/:index/download', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  const sample = sampleBank[index]
  if (!sample.filename) {
    return res.status(404).json({ error: 'No audio file for this sample' })
  }
  const filePath = join(SAMPLES_DIR, sample.filename)
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' })
  }
  const ext = extname(sample.filename).toLowerCase()
  res.setHeader('Content-Disposition', `attachment; filename="${sample.name}${ext}"`)
  createReadStream(filePath).pipe(res)
})

router.put('/:index/rename', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  const { name } = req.body
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' })
  }
  sampleBank[index].name = name.slice(0, 16)
  res.json({ ok: true, sample: sampleBank[index] })
})

router.post('/:index/upload', upload.single('file'), async (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or unsupported format' })
  }

  const srcPath = req.file.path
  const dstFilename = `sample_${index}.wav`
  const dstPath = join(SAMPLES_DIR, dstFilename)

  // Remove previously stored file if it differs from the target
  const oldFilename = sampleBank[index].filename
  if (oldFilename && oldFilename !== dstFilename) {
    const oldPath = join(SAMPLES_DIR, oldFilename)
    if (existsSync(oldPath)) unlinkSync(oldPath)
  }

  try {
    await convertWithFfmpeg(srcPath, dstPath)
    // Delete temp source only after successful conversion
    unlinkSync(srcPath)
    sampleBank[index].filename = dstFilename
    sampleBank[index].size = statSync(dstPath).size
    res.json({ ok: true, sample: sampleBank[index] })
  } catch (err) {
    // ffmpeg not found or conversion failed — store original as-is
    const ext = extname(req.file.originalname) || '.wav'
    const fallbackFilename = `sample_${index}${ext}`
    const fallbackPath = join(SAMPLES_DIR, fallbackFilename)
    if (srcPath !== fallbackPath) renameSync(srcPath, fallbackPath)
    sampleBank[index].filename = fallbackFilename
    sampleBank[index].size = req.file.size
    const warning = err.code === 'ENOENT'
      ? 'ffmpeg not found, stored as-is'
      : 'Conversion failed, stored as-is'
    res.json({ ok: true, sample: sampleBank[index], warning })
  }
})

router.post('/:index/send', (req, res) => {
  res.json({ ok: false, message: 'Sample SysEx transfer not implemented. Use SD card or Novation Components.' })
})

router.delete('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  const sample = sampleBank[index]
  if (sample.filename) {
    const filePath = join(SAMPLES_DIR, sample.filename)
    if (existsSync(filePath)) unlinkSync(filePath)
  }
  sampleBank[index] = { name: `Sample ${index + 1}`, index, size: 0, filename: null }
  res.json({ ok: true })
})

router.put('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  sampleBank[index] = { ...sampleBank[index], ...req.body, index }
  res.json({ ok: true, sample: sampleBank[index] })
})

export default router
