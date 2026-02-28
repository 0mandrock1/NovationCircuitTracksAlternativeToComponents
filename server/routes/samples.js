import { Router } from 'express'
import multer from 'multer'
import { join, extname } from 'path'
import { existsSync, mkdirSync, unlinkSync, createReadStream } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SAMPLES_DIR = join(__dirname, '../../data/samples')

if (!existsSync(SAMPLES_DIR)) {
  mkdirSync(SAMPLES_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SAMPLES_DIR),
  filename: (req, file, cb) => {
    const index = req.params.index
    const ext = extname(file.originalname) || '.wav'
    cb(null, `sample_${index}${ext}`)
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

router.post('/:index/upload', upload.single('file'), (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or unsupported format' })
  }
  const oldFilename = sampleBank[index].filename
  if (oldFilename && oldFilename !== req.file.filename) {
    const oldPath = join(SAMPLES_DIR, oldFilename)
    if (existsSync(oldPath)) unlinkSync(oldPath)
  }
  sampleBank[index].filename = req.file.filename
  sampleBank[index].size = req.file.size
  res.json({ ok: true, sample: sampleBank[index] })
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
