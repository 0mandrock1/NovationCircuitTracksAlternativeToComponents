import { DEVICE_PORT_PATTERNS, SYSEX_MIN_DELAY_MS } from './constants.js'

let easymidi = null
try {
  easymidi = (await import('easymidi')).default
} catch {
  // easymidi not available — MIDI features disabled
}

class MidiManager {
  constructor() {
    this.input = null
    this.output = null
    this.portName = null
    this.listeners = new Map()
    this._lastSysExTime = 0
  }

  getAvailablePorts() {
    if (!easymidi) return []
    try {
      return easymidi.getInputs()
    } catch {
      return []
    }
  }

  findCircuitPort() {
    const ports = this.getAvailablePorts()
    for (const pattern of DEVICE_PORT_PATTERNS) {
      const found = ports.find(p => pattern.test(p))
      if (found) return found
    }
    return null
  }

  connect(portName) {
    this.disconnect()
    if (!easymidi) throw new Error('MIDI library not available')

    const outputs = easymidi.getOutputs()
    if (!outputs.includes(portName)) throw new Error(`Output port "${portName}" not found`)

    this.input = new easymidi.Input(portName)
    this.output = new easymidi.Output(portName)
    this.portName = portName

    this.input.on('sysex', (msg) => this._emit('sysex', msg))
    this.input.on('cc', (msg) => this._emit('cc', msg))
    this.input.on('noteon', (msg) => this._emit('noteon', msg))
    this.input.on('noteoff', (msg) => this._emit('noteoff', msg))

    return true
  }

  disconnect() {
    if (this.input) {
      this.input.close()
      this.input = null
    }
    if (this.output) {
      this.output.close()
      this.output = null
    }
    this.portName = null
  }

  isConnected() {
    return this.input !== null && this.output !== null
  }

  async sendSysEx(bytes) {
    if (!this.output) throw new Error('Not connected')
    const now = Date.now()
    const elapsed = now - this._lastSysExTime
    if (elapsed < SYSEX_MIN_DELAY_MS) {
      await new Promise(r => setTimeout(r, SYSEX_MIN_DELAY_MS - elapsed))
    }
    this.output.send('sysex', bytes)
    this._lastSysExTime = Date.now()
  }

  sendCC(channel, controller, value) {
    if (!this.output) throw new Error('Not connected')
    this.output.send('cc', { channel, controller, value })
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(handler)
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return
    const list = this.listeners.get(event).filter(h => h !== handler)
    this.listeners.set(event, list)
  }

  _emit(event, data) {
    const handlers = this.listeners.get(event) || []
    for (const h of handlers) h(data)
  }
}

export default new MidiManager()
