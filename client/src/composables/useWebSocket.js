import { ref, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { usePatchesStore } from '@/stores/patches'
import { useMixerStore }   from '@/stores/mixer'

let ws = null
let reconnectTimer = null
const listeners = new Map()

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
  // Built-in handlers
  const device   = useDeviceStore()
  const patches  = usePatchesStore()

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
      device.recordActivity()
      useMixerStore().handleCC(msg)
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
