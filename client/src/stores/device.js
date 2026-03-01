import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { requestAccess, getPorts, connect as midiConnect, disconnect as midiDisconnect, forgetDevice, isConnected, on } from '@/composables/useMidi.js'

const WATCHDOG_INTERVAL_MS = 2000

export const useDeviceStore = defineStore('device', () => {
  const connected       = ref(false)
  const portName        = ref('')
  const firmwareVersion = ref('')
  const availablePorts  = ref([])
  const lastActivity    = ref(null)
  const midiInitialized = ref(false)
  const midiSupported   = ref(!!navigator.requestMIDIAccess)

  let watchdogTimer = null

  const statusText = computed(() => {
    if (connected.value) return `Connected: ${portName.value}`
    return 'Disconnected'
  })

  async function initMidi() {
    if (midiInitialized.value) return true
    const ok = await requestAccess()
    if (!ok) return false
    midiInitialized.value = true

    on('connected',   (name) => { connected.value = true;  portName.value = name })
    on('disconnected', ()    => { connected.value = false; portName.value = '' })
    on('portschange',  ()    => { availablePorts.value = getPorts() })

    availablePorts.value = getPorts()
    _startWatchdog()
    return true
  }

  function _startWatchdog() {
    if (watchdogTimer) return
    watchdogTimer = setInterval(() => {
      availablePorts.value = getPorts()
      if (connected.value && !isConnected()) {
        connected.value = false
        portName.value  = ''
      }
    }, WATCHDOG_INTERVAL_MS)
  }

  function fetchPorts() {
    availablePorts.value = getPorts()
  }

  async function connect(port) {
    const ok = await midiConnect(port)
    if (ok) {
      connected.value = true
      portName.value  = port
    }
    return ok
  }

  function disconnect() {
    forgetDevice()
    connected.value       = false
    portName.value        = ''
    firmwareVersion.value = ''
  }

  function recordActivity() {
    lastActivity.value = Date.now()
  }

  return {
    connected, portName, firmwareVersion, availablePorts, lastActivity,
    midiInitialized, midiSupported,
    statusText,
    initMidi, fetchPorts, connect, disconnect, recordActivity,
  }
})
