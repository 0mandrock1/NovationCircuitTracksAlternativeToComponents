import { DEVICE_PORT_PATTERNS, SYSEX_MIN_DELAY_MS, SYSEX_DUMP_TIMEOUT_MS } from './constants.js'

let easymidi = null
try {
  easymidi = (await import('easymidi')).default
} catch {
  // easymidi not available — MIDI features disabled (no physical device)
}

class MidiManager {
  constructor() {
    this.input      = null
    this.output     = null
    this.portName   = null
    this.listeners  = new Map()
    this._lastSysExTime = 0
    // pending sysex response resolvers: Map<cmdByte, { resolve, reject, timer }>
    this._pendingResponses = new Map()
    // MIDI clock state
    this._clockTicks    = 0
    this._clockPlaying  = false
  }

  getAvailablePorts() {
    if (!easymidi) return []
    try {
      const inputs  = easymidi.getInputs()
      const outputs = easymidi.getOutputs()
      // Return ports that have both an input and output (bidirectional devices)
      return inputs.filter(p => outputs.includes(p))
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

    this.input  = new easymidi.Input(portName)
    this.output = new easymidi.Output(portName)
    this.portName = portName

    this.input.on('sysex',    (msg) => this._onSysEx(msg))
    this.input.on('cc',       (msg) => this._emit('cc', msg))
    this.input.on('noteon',   (msg) => this._emit('noteon', msg))
    this.input.on('noteoff',  (msg) => this._emit('noteoff', msg))
    this.input.on('clock',    ()    => this._onClock())
    this.input.on('start',    ()    => { this._clockTicks = 0; this._clockPlaying = true; this._emit('transport', 'start') })
    this.input.on('stop',     ()    => { this._clockPlaying = false; this._emit('transport', 'stop') })
    this.input.on('continue', ()    => { this._clockPlaying = true;  this._emit('transport', 'continue') })

    return true
  }

  disconnect() {
    // Reject all pending sysex requests
    for (const { reject, timer } of this._pendingResponses.values()) {
      clearTimeout(timer)
      reject(new Error('Disconnected'))
    }
    this._pendingResponses.clear()

    if (this.input)  { this.input.close();  this.input  = null }
    if (this.output) { this.output.close(); this.output = null }
    this.portName = null
  }

  isConnected() {
    return this.input !== null && this.output !== null
  }

  /**
   * Send a SysEx message, respecting the 20 ms minimum inter-message delay.
   * bytes: Array of numbers including leading 0xF0 and trailing 0xF7.
   */
  async sendSysEx(bytes) {
    if (!this.output) throw new Error('Not connected')
    const now     = Date.now()
    const elapsed = now - this._lastSysExTime
    if (elapsed < SYSEX_MIN_DELAY_MS) {
      await new Promise(r => setTimeout(r, SYSEX_MIN_DELAY_MS - elapsed))
    }
    this.output.send('sysex', bytes)
    this._lastSysExTime = Date.now()
    this._emit('sysexout', bytes)
  }

  /**
   * Send a SysEx request and wait for a response matching responseCmd.
   * Resolves with the raw SysEx bytes; rejects on timeout.
   */
  async sendSysExAndWait(bytes, responseCmd, timeoutMs = SYSEX_DUMP_TIMEOUT_MS) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        this._pendingResponses.delete(responseCmd)
        reject(new Error(`SysEx response timeout (cmd 0x${responseCmd.toString(16)})`))
      }, timeoutMs)

      this._pendingResponses.set(responseCmd, { resolve, reject, timer })
      try {
        await this.sendSysEx(bytes)
      } catch (err) {
        clearTimeout(timer)
        this._pendingResponses.delete(responseCmd)
        reject(err)
      }
    })
  }

  sendCC(channel, controller, value) {
    if (!this.output) throw new Error('Not connected')
    this.output.send('cc', { channel, controller, value })
  }

  sendStart() {
    if (!this.output) throw new Error('Not connected')
    this.output.send('start', {})
  }

  sendStop() {
    if (!this.output) throw new Error('Not connected')
    this.output.send('stop', {})
  }

  sendContinue() {
    if (!this.output) throw new Error('Not connected')
    this.output.send('continue', {})
  }

  // ── MIDI Clock handling ──────────────────────────────────────────────────────

  _onClock() {
    if (!this._clockPlaying) return
    this._clockTicks++
    // 6 ticks per 1/16 step (24 ppqn / 4 = 6 ticks per 16th note)
    if (this._clockTicks % 6 === 0) {
      const step = (this._clockTicks / 6 - 1) % 32
      this._emit('clock:step', step)
    }
    // Reset after 32 steps (192 ticks)
    if (this._clockTicks >= 192) this._clockTicks = 0
  }

  // ── Event system ────────────────────────────────────────────────────────────

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(handler)
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return
    this.listeners.set(event, this.listeners.get(event).filter(h => h !== handler))
  }

  _emit(event, data) {
    for (const h of (this.listeners.get(event) ?? [])) h(data)
  }

  _onSysEx(msg) {
    const bytes = Array.from(msg.bytes ?? [])

    // Check if any pending request is waiting for this command
    if (bytes.length >= 7) {
      const cmd = bytes[6]
      const pending = this._pendingResponses.get(cmd)
      if (pending) {
        clearTimeout(pending.timer)
        this._pendingResponses.delete(cmd)
        pending.resolve(bytes)
        return  // consumed by pending request — don't broadcast
      }
    }

    this._emit('sysex', bytes)
  }
}

export default new MidiManager()
