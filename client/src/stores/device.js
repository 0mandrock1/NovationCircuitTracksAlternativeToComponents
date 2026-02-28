import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDeviceStore = defineStore('device', () => {
  const connected = ref(false)
  const portName = ref('')
  const firmwareVersion = ref('')
  const availablePorts = ref([])
  const lastActivity = ref(null)
  const midiOutCount = ref(0)

  const statusText = computed(() => {
    if (connected.value) return `Connected: ${portName.value}`
    return 'Disconnected'
  })

  async function fetchPorts() {
    const res = await fetch('/api/device/ports')
    const data = await res.json()
    availablePorts.value = data.ports
  }

  async function connect(port) {
    const res = await fetch('/api/device/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port })
    })
    const data = await res.json()
    if (data.ok) {
      connected.value = true
      portName.value = port
    }
    return data
  }

  async function disconnect() {
    await fetch('/api/device/disconnect', { method: 'POST' })
    connected.value = false
    portName.value = ''
    firmwareVersion.value = ''
  }

  function setConnected(port) {
    connected.value = true
    portName.value = port
  }

  function setDisconnected() {
    connected.value = false
    portName.value = ''
  }

  function recordActivity() {
    lastActivity.value = Date.now()
  }

  function recordMidiOut() {
    midiOutCount.value++
  }

  return {
    connected,
    portName,
    firmwareVersion,
    availablePorts,
    lastActivity,
    midiOutCount,
    statusText,
    fetchPorts,
    connect,
    disconnect,
    setConnected,
    setDisconnected,
    recordActivity,
    recordMidiOut,
  }
})
