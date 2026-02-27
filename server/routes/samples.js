import { Router } from 'express'

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

router.put('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid sample index' })
  }
  sampleBank[index] = { ...sampleBank[index], ...req.body, index }
  res.json({ ok: true, sample: sampleBank[index] })
})

export default router
