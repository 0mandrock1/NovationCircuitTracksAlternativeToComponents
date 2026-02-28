import { Router } from 'express'

const router = Router()

const PROJECT_COUNT = 64
const SCENE_COUNT   = 8

function _emptyProject(i) {
  return {
    index: i,
    name:  `Project ${i + 1}`,
    color: 0,
    scenes: Array.from({ length: SCENE_COUNT }, (_, s) => ({
      index:    s,
      name:     `Scene ${s + 1}`,
      patterns: Array(8).fill(null),  // pattern index per track, null = empty
    })),
  }
}

const projects = Array.from({ length: PROJECT_COUNT }, (_, i) => _emptyProject(i))

// ── GET /api/sessions ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({ projects: projects.map(p => ({ index: p.index, name: p.name, color: p.color })) })
})

// ── GET /api/sessions/:index ──────────────────────────────────────────────────
router.get('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid index' })
  res.json(projects[index])
})

// ── PUT /api/sessions/:index  — rename / update color ─────────────────────────
router.put('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid index' })
  if (req.body.name  !== undefined) projects[index].name  = String(req.body.name).slice(0, 16)
  if (req.body.color !== undefined) projects[index].color = Number(req.body.color)
  res.json({ ok: true, project: projects[index] })
})

// ── POST /api/sessions/:index/copy  — copy project to target slot ─────────────
router.post('/:index/copy', (req, res) => {
  const src = parseInt(req.params.index, 10)
  const dst = parseInt(req.body.targetIndex ?? -1, 10)
  if (src < 0 || src >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid source index' })
  if (dst < 0 || dst >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid target index' })
  projects[dst] = JSON.parse(JSON.stringify({ ...projects[src], index: dst, name: `${projects[src].name} (copy)`.slice(0, 16) }))
  res.json({ ok: true, project: projects[dst] })
})

// ── DELETE /api/sessions/:index  — reset project slot ────────────────────────
router.delete('/:index', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid index' })
  projects[index] = _emptyProject(index)
  res.json({ ok: true })
})

// ── GET /api/sessions/:index/export  — export project as JSON wrapped in .syx extension ─────
router.get('/:index/export', (req, res) => {
  const index = parseInt(req.params.index, 10)
  if (index < 0 || index >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid index' })
  const safeName = projects[index].name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || `project_${index}`
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`)
  res.json(projects[index])
})

// ── POST /api/sessions/import  — import project from JSON ─────────────────────
router.post('/import', (req, res) => {
  const { index, data } = req.body
  const i = parseInt(index ?? -1, 10)
  if (i < 0 || i >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid index' })
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Missing data' })

  const incoming = { ...data, index: i }
  if (typeof incoming.name !== 'string') return res.status(400).json({ error: 'Invalid project data' })
  projects[i] = { ..._emptyProject(i), ...incoming, index: i }
  res.json({ ok: true, project: projects[i] })
})

// ── PUT /api/sessions/:index/scenes/:sceneIndex ─── update scene ──────────────
router.put('/:index/scenes/:sceneIndex', (req, res) => {
  const pIdx = parseInt(req.params.index, 10)
  const sIdx = parseInt(req.params.sceneIndex, 10)
  if (pIdx < 0 || pIdx >= PROJECT_COUNT) return res.status(400).json({ error: 'Invalid project index' })
  if (sIdx < 0 || sIdx >= SCENE_COUNT)   return res.status(400).json({ error: 'Invalid scene index' })
  const scene = projects[pIdx].scenes[sIdx]
  if (req.body.name     !== undefined) scene.name     = String(req.body.name).slice(0, 16)
  if (req.body.patterns !== undefined) scene.patterns = req.body.patterns
  res.json({ ok: true, scene })
})

export default router
