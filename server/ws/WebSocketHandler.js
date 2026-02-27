import { WebSocketServer } from 'ws'
import midiManager from '../midi/MidiManager.js'

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    // Send current connection status on connect
    ws.send(JSON.stringify({
      type: 'device:status',
      connected: midiManager.isConnected(),
      port: midiManager.portName
    }))

    // Forward MIDI events to this client
    const onCC = (msg) => send(ws, { type: 'midi:cc', ...msg })
    const onSysEx = (msg) => send(ws, { type: 'midi:sysex', data: Array.from(msg.bytes || []) })
    const onNoteOn = (msg) => send(ws, { type: 'midi:noteon', ...msg })
    const onNoteOff = (msg) => send(ws, { type: 'midi:noteoff', ...msg })

    midiManager.on('cc', onCC)
    midiManager.on('sysex', onSysEx)
    midiManager.on('noteon', onNoteOn)
    midiManager.on('noteoff', onNoteOff)

    ws.on('close', () => {
      midiManager.off('cc', onCC)
      midiManager.off('sysex', onSysEx)
      midiManager.off('noteon', onNoteOn)
      midiManager.off('noteoff', onNoteOff)
    })

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        handleClientMessage(ws, msg, wss)
      } catch {
        // ignore malformed messages
      }
    })
  })

  // Broadcast helper used by REST routes
  wss.broadcast = (data) => {
    const payload = JSON.stringify(data)
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload)
    }
  }

  return wss
}

function handleClientMessage(ws, msg, wss) {
  // Client-initiated actions via WebSocket (optional, REST is primary)
  switch (msg.type) {
    case 'ping':
      send(ws, { type: 'pong' })
      break
  }
}

function send(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data))
  }
}
