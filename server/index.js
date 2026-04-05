import express from 'express'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { setupWebSocket } from './ws/WebSocketHandler.js'
import patchesRouter from './routes/patches.js'
import samplesRouter from './routes/samples.js'
import sessionsRouter from './routes/sessions.js'
import deviceRouter from './routes/device.js'
import mixerRouter from './routes/mixer.js'
import transportRouter from './routes/transport.js'

const PORT = process.env.PORT || 3000
const __dirname = dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = join(__dirname, '../client/dist')

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
app.use('/api/mixer', mixerRouter)
app.use('/api/transport', transportRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' })
})

const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  // In dev mode proxy all non-API requests to the Vite dev server.
  // This lets both localhost:3000 and localhost:5173 work.
  const { createProxyMiddleware } = await import('http-proxy-middleware')
  const VITE_URL = process.env.VITE_URL || 'http://localhost:5173'
  app.use('/', createProxyMiddleware({
    target: VITE_URL,
    changeOrigin: true,
    ws: false,          // WS is handled by the Vite proxy on port 5173
    logLevel: 'silent',
    on: {
      error: (err, req, res) => {
        if (!res.headersSent) res.status(502).send('Vite dev server not ready — start it with npm run dev:client')
      }
    }
  }))
} else {
  app.use(express.static(CLIENT_DIST))
  app.get('*', (req, res, next) => {
    res.sendFile(join(CLIENT_DIST, 'index.html'), (err) => { if (err) next(err) })
  })
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

const server = createServer(app)

// Must be registered BEFORE setupWebSocket so it fires first and can exit
// cleanly before the ws package re-emits the error without a handler.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[server] Port ${PORT} is already in use. Kill the old process and restart.\n`)
    process.exit(1)
  } else {
    throw err
  }
})

setupWebSocket(server)

server.listen(PORT, () => {
  if (isDev) {
    console.log(`[server] API + WS on http://localhost:${PORT}`)
    console.log(`[server] Open the app at http://localhost:5173  (Vite dev server)`)
    console.log(`[server]   — or —  http://localhost:${PORT}  (proxied through Express)`)
  } else {
    console.log(`Circuit Tracks server running on http://localhost:${PORT}`)
  }
})

// Graceful shutdown so node --watch can reclaim the port immediately
function shutdown() {
  server.closeAllConnections?.()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 500).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT',  shutdown)
