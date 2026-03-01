import { reactive, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { usePatchesStore } from '@/stores/patches'
import { useMixerStore } from '@/stores/mixer'
import { useSequencerStore } from '@/stores/sequencer'

let ws = null
let reconnectTimer = null
const listeners = new Map()

// ── MIDI activity state (shared singleton) ────────────────────────────────────
export const midiActivity = reactive({ in: false, out: false })
let inTimer = null
let outTimer = null

function flashMidiIn() {
  midiActivity.in = true
  clearTimeout(inTimer)
  inTimer = setTimeout(() => { midiActivity.in = false }, 300)
}

export function flashMidiOut() {
  midiActivity.out = true
  clearTimeout(outTimer)
  outTimer = setTimeout(() => { midiActivity.out = false }, 300)
}

// ── Patch window.fetch to detect MIDI-out API calls ───────────────────────────
let fetchPatched = false
function patchFetch() {
  if (fetchPatched || typeof window === 'undefined') return
  fetchPatched = true
  const orig = window.fetch
  window.fetch = function (url, ...args) {
    const s = String(url)
    if (s.includes('/api/mixer/cc') || s.includes('/api/transport/')) {
      flashMidiOut()
    }
    return orig.call(this, url, ...args)
  }
}

// ── WebSocket connection ───────────────────────────────────────────────────────
function connect() {
  if (ws && ws.readyState < 2) return  // already open or connecting

  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${proto}://${location.host}/ws`)

  ws.addEventListener('message', (ev) => {
    let msg
    try { msg = JSON.parse(ev.data) } catch { return }
    dispatch(msg)
  })

  ws.addEventListener('close', () => {
    ws = null
    reconnectTimer = setTimeout(connect, 3000)
  })

  ws.addEventListener('error', () => {
    ws?.close()
  })
}

function dispatch(msg) {
  const device  = useDeviceStore()
  const patches = usePatchesStore()

  switch (msg.type) {
    case 'device:status':
      if (msg.connected) device.setConnected(msg.port)
      else               device.setDisconnected()
      break

    case 'patch:update':
      patches.handleWsPatchUpdate(msg)
      break

    case 'patch:currentDump':
      patches.handleWsCurrentDump(msg)
      break

    case 'midi:cc':
      flashMidiIn()
      device.recordActivity()
      useMixerStore().applyIncomingCC(msg.channel, msg.controller, msg.value)
      break

    case 'midi:noteon':
    case 'midi:noteoff':
    case 'midi:sysex':
      flashMidiIn()
      break

    case 'sequencer:step':
      flashMidiIn()
      useSequencerStore().playingStep = msg.step
      break

    case 'sequencer:transport':
      useSequencerStore().transportState = msg.state
      break
  }

  // External listeners
  for (const handler of (listeners.get(msg.type) ?? [])) handler(msg)
  for (const handler of (listeners.get('*') ?? []))        handler(msg)
}

export function useWebSocket() {
  connect()
  patchFetch()

  function on(type, handler) {
    if (!listeners.has(type)) listeners.set(type, [])
    listeners.get(type).push(handler)
    onUnmounted(() => off(type, handler))
  }

  function off(type, handler) {
    listeners.set(type, (listeners.get(type) ?? []).filter(h => h !== handler))
  }

  return { on, off }
}

export function initWebSocket() {
  connect()
  patchFetch()
}
