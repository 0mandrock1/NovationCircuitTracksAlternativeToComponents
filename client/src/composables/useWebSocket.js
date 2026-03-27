import { reactive, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { usePatchesStore } from '@/stores/patches'
import { useMixerStore } from '@/stores/mixer'
import { useSequencerStore } from '@/stores/sequencer'
import { on as midiOn, isConnected as midiConnected } from '@/composables/useMidi.js'

let ws = null
let reconnectTimer = null
const listeners = new Map()

// ── MIDI activity state (shared singleton) ────────────────────────────────────
export const midiActivity = reactive({ in: false, out: false })
let inTimer = null
let outTimer = null

export function flashMidiIn() {
  midiActivity.in = true
  clearTimeout(inTimer)
  inTimer = setTimeout(() => { midiActivity.in = false }, 300)
}

export function flashMidiOut() {
  midiActivity.out = true
  clearTimeout(outTimer)
  outTimer = setTimeout(() => { midiActivity.out = false }, 300)
}

// ── Wire Web MIDI events to activity indicators (once at module load) ─────────
midiOn('ccout',    flashMidiOut)
midiOn('sysexout', flashMidiOut)
midiOn('noteout',  flashMidiOut)
midiOn('nrpnout',  flashMidiOut)
midiOn('cc',       flashMidiIn)
midiOn('sysex',    flashMidiIn)
midiOn('noteon',   flashMidiIn)

// ── WebSocket connection ───────────────────────────────────────────────────────
const WS_URL = import.meta.env.VITE_WS_URL ?? (() => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
})()

function connect() {
  if (ws && ws.readyState < 2) return  // already open or connecting

  ws = new WebSocket(WS_URL)

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
      // Guard: if Web MIDI is active, CC is already handled client-side
      if (!midiConnected()) useMixerStore().applyIncomingCC(msg.channel, msg.controller, msg.value)
      break

    case 'midi:noteon':
    case 'midi:noteoff':
    case 'midi:sysex':
      flashMidiIn()
      break

    case 'sequencer:step':
      // Guard: if Web MIDI clock is running, step is driven by useMidi directly
      if (!midiConnected()) {
        flashMidiIn()
        useSequencerStore().setPlayingStep(msg.step)
      }
      break

    case 'sequencer:transport':
      if (!midiConnected()) useSequencerStore().setTransportState(msg.state)
      break
  }

  // External listeners
  for (const handler of (listeners.get(msg.type) ?? [])) handler(msg)
  for (const handler of (listeners.get('*') ?? []))        handler(msg)
}

export function useWebSocket() {
  connect()

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
}
