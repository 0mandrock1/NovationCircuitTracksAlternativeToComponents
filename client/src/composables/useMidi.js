// Web MIDI API singleton manager

import { SYSEX_MIN_DELAY_MS, SYSEX_DUMP_TIMEOUT_MS, DEVICE_PORT_PATTERNS } from '@/midi/constants.js'

// ── Singleton state ───────────────────────────────────────────────────────────
let midiAccess    = null
let inputPort     = null
let outputPort    = null
let _portName     = null
let lastPortName  = null
let lastSysExTime = 0

const listeners        = new Map()
const pendingResponses = new Map()

// ── Internal helpers ──────────────────────────────────────────────────────────

function emit(event, data) {
  for (const handler of (listeners.get(event) ?? [])) {
    try { handler(data) } catch { /* */ }
  }
}

function onMidiMessage(ev) {
  const raw    = ev.data
  const status = raw[0]

  // MIDI Clock (0xF8): skip entirely — fires 48+ times/sec
  if (status === 0xF8) return

  const data    = Array.from(raw)
  const type    = status & 0xF0
  const channel = status & 0x0F

  if (status === 0xF0) {
    if (import.meta.env.DEV) {
      const hex = data.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
      console.log(`[MIDI SysEx IN] cmd=0x${data[6]?.toString(16).padStart(2,'0').toUpperCase() ?? '??'} len=${data.length} ${hex}`)
    }
    emit('sysex', data)
    if (data.length > 6) {
      const cmd = data[6]
      if (pendingResponses.has(cmd)) {
        const { resolve, timer } = pendingResponses.get(cmd)
        clearTimeout(timer)
        pendingResponses.delete(cmd)
        resolve(data)
      }
    }
    return
  }

  if (status === 0xFA) { emit('transport', 'start');    return }
  if (status === 0xFB) { emit('transport', 'continue'); return }
  if (status === 0xFC) { emit('transport', 'stop');     return }

  if (type === 0x80) { emit('noteoff', { channel, note: data[1], velocity: data[2] }); return }
  if (type === 0x90) { emit('noteon',  { channel, note: data[1], velocity: data[2] }); return }
  if (type === 0xB0) { emit('cc',      { channel, controller: data[1], value: data[2] }); return }
}

let statechangeTimer = null
function onPortsChange() {
  clearTimeout(statechangeTimer)
  statechangeTimer = setTimeout(_handlePortsChange, 150)
}

function _handlePortsChange() {
  const ports = getPorts()
  emit('portschange', ports)

  if (_portName && !ports.includes(_portName)) {
    if (inputPort) inputPort.onmidimessage = null
    inputPort  = null
    outputPort = null
    _portName  = null
    emit('disconnected', null)
  }

  if (!inputPort && lastPortName && ports.includes(lastPortName)) {
    connect(lastPortName)  // fire-and-forget for auto-reconnect
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function requestAccess() {
  if (!navigator.requestMIDIAccess) return false
  try {
    midiAccess = await navigator.requestMIDIAccess({ sysex: true })
    midiAccess.addEventListener('statechange', onPortsChange)
    return true
  } catch {
    return false
  }
}

export function getPorts() {
  if (!midiAccess) return []
  const inputNames  = new Set([...midiAccess.inputs.values()].map(p => p.name))
  const outputNames = new Set([...midiAccess.outputs.values()].map(p => p.name))
  const all = [...inputNames].filter(n => outputNames.has(n))
  return all.sort((a, b) => {
    const aMatch = DEVICE_PORT_PATTERNS.some(rx => rx.test(a))
    const bMatch = DEVICE_PORT_PATTERNS.some(rx => rx.test(b))
    if (aMatch && !bMatch) return -1
    if (!aMatch && bMatch) return 1
    return 0
  })
}

/** Connect to a named port. Returns true on success. */
export async function connect(portName) {
  if (!midiAccess) return false

  const input  = [...midiAccess.inputs.values()].find(p => p.name === portName)
  const output = [...midiAccess.outputs.values()].find(p => p.name === portName)
  if (!input || !output) return false

  if (inputPort) inputPort.onmidimessage = null

  // Explicitly open both ports and wait — prevents "pending" state message loss
  try {
    await Promise.all([input.open(), output.open()])
  } catch { /* non-fatal */ }

  inputPort    = input
  outputPort   = output
  _portName    = portName
  lastPortName = portName

  inputPort.onmidimessage = onMidiMessage

  emit('connected', portName)
  return true
}

export function disconnect() {
  if (inputPort) inputPort.onmidimessage = null
  inputPort  = null
  outputPort = null
  _portName  = null
  emit('disconnected', null)
}

export function forgetDevice() {
  lastPortName = null
  disconnect()
}

export function getPortName() { return _portName }
export function isConnected() { return !!outputPort && outputPort.state !== 'disconnected' }

export function sendCC(channel, controller, value) {
  if (!outputPort) {
    if (import.meta.env.DEV) console.warn(`[MIDI] sendCC dropped (port not open): Ch${channel + 1} CC${controller}=${value}`)
    return
  }
  try {
    outputPort.send([0xB0 | (channel & 0x0F), controller & 0x7F, value & 0x7F])
    emit('ccout', { channel, controller, value })
  } catch { /* port may have closed */ }
}

export async function sendSysEx(bytes) {
  if (!outputPort) return
  const now  = Date.now()
  const wait = SYSEX_MIN_DELAY_MS - (now - lastSysExTime)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  try {
    outputPort.send(new Uint8Array(bytes))
    lastSysExTime = Date.now()
    emit('sysexout', bytes)
  } catch { /* port may have closed */ }
}

export function sendSysExAndWait(bytes, responseCmd, timeout = SYSEX_DUMP_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingResponses.delete(responseCmd)
      reject(new Error(`SysEx timeout (cmd 0x${responseCmd.toString(16)})`))
    }, timeout)

    pendingResponses.set(responseCmd, { resolve, reject, timer })
    sendSysEx(bytes).catch(err => {
      clearTimeout(timer)
      pendingResponses.delete(responseCmd)
      reject(err)
    })
  })
}

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, [])
  listeners.get(event).push(handler)
  return () => off(event, handler)
}

export function off(event, handler) {
  listeners.set(event, (listeners.get(event) ?? []).filter(h => h !== handler))
}

export function useMidi() {
  return { requestAccess, getPorts, connect, disconnect, forgetDevice, getPortName, isConnected, sendCC, sendSysEx, sendSysExAndWait, on, off }
}

export default useMidi
