import { WebSocketServer } from 'ws'
import midiManager from '../midi/MidiManager.js'
import { parseSysEx } from '../midi/SysExParser.js'
import { decodePatchName, rawBytesToParams } from '../midi/SysExBuilder.js'

// Lazy import to avoid circular at startup — patches route registers banks first
let banks = null
async function getBanks() {
  if (!banks) banks = (await import('../routes/patches.js')).banks
  return banks
}

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    _send(ws, {
      type:      'device:status',
      connected: midiManager.isConnected(),
      port:      midiManager.portName,
    })

    const onCC      = (msg) => _send(ws, { type: 'midi:cc',      ...msg })
    const onNoteOn  = (msg) => _send(ws, { type: 'midi:noteon',  ...msg })
    const onNoteOff = (msg) => _send(ws, { type: 'midi:noteoff', ...msg })

    const onSysEx = async (bytes) => {
      // Forward raw bytes for debug consumers
      _send(ws, { type: 'midi:sysex', data: Array.from(bytes) })

      const parsed = parseSysEx(bytes)
      if (!parsed) return

      const b = await getBanks()

      if (parsed.type === 'patchDump') {
        const { patchIndex, rawBytes } = parsed
        if (patchIndex >= 0 && patchIndex < 64) {
          b[0][patchIndex] = {
            index:   patchIndex,
            rawBytes: Array.from(rawBytes),
            name:    decodePatchName(rawBytes),
            params:  rawBytesToParams(rawBytes),
          }
          wss.broadcast({
            type:   'patch:update',
            track:  0,
            index:  patchIndex,
            name:   b[0][patchIndex].name,
            params: b[0][patchIndex].params,
          })
        }
      }

      if (parsed.type === 'currentPatchDump') {
        wss.broadcast({
          type:     'patch:currentDump',
          track:    0,
          params:   parsed.params,
          rawBytes: Array.from(parsed.rawBytes),
        })
      }
    }

    midiManager.on('cc',      onCC)
    midiManager.on('noteon',  onNoteOn)
    midiManager.on('noteoff', onNoteOff)
    midiManager.on('sysex',   onSysEx)

    ws.on('close', () => {
      midiManager.off('cc',      onCC)
      midiManager.off('noteon',  onNoteOn)
      midiManager.off('noteoff', onNoteOff)
      midiManager.off('sysex',   onSysEx)
    })

    ws.on('message', (raw) => {
      try {
        handleClientMessage(ws, JSON.parse(raw.toString()))
      } catch { /* ignore malformed */ }
    })
  })

  wss.broadcast = (data) => {
    const payload = JSON.stringify(data)
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload)
    }
  }

  return wss
}

function handleClientMessage(ws, msg) {
  if (msg.type === 'ping') _send(ws, { type: 'pong' })
}

function _send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data))
}
