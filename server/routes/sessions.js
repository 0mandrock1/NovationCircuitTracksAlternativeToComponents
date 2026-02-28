import { Router } from 'express'

const router = Router()

const projects = Array.from({ length: 64 }, (_, i) => ({
  name: `Project ${i + 1}`,
  index: i,
  color: 0
}))

router.get('/', (req, res) => {
  res.json({ projects })
})

router.get('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid project index' })
  }
  res.json(projects[index])
})

router.put('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= 64) {
    return res.status(400).json({ error: 'Invalid project index' })
  }
  projects[index] = { ...projects[index], ...req.body, index }
  res.json({ ok: true, project: projects[index] })
})

export default router
