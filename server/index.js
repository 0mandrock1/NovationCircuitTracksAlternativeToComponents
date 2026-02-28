import express from 'express'
import { createServer } from 'http'
import { setupWebSocket } from './ws/WebSocketHandler.js'
import patchesRouter from './routes/patches.js'
import samplesRouter from './routes/samples.js'
import sessionsRouter from './routes/sessions.js'
import deviceRouter from './routes/device.js'

const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())

// CORS for dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// Routes
app.use('/api/patches', patchesRouter)
app.use('/api/samples', samplesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/device', deviceRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

const server = createServer(app)
setupWebSocket(server)

server.listen(PORT, () => {
  console.log(`Circuit Tracks server running on http://localhost:${PORT}`)
})
