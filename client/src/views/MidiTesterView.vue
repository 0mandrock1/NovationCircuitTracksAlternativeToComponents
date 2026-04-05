<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { on, off, sendCC, sendNoteOn, sendNoteOff, sendSysEx, isConnected as midiIsConnected } from '@/composables/useMidi.js'
import { useWebSocket } from '@/composables/useWebSocket.js'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()
const { on: wsOn } = useWebSocket()

// ── Message log ───────────────────────────────────────────────────────────────

const MAX_LOG = 300
const log     = ref([])
let   logId   = 0

function addLog(source, type, data) {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
  log.value.unshift({ id: logId++, source, type, data, time })
  if (log.value.length > MAX_LOG) log.value.length = MAX_LOG
}

function hexStr(arr) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

// ── Web MIDI listeners ────────────────────────────────────────────────────────

function onCC(msg)      { addLog('MIDI', 'CC',       `Ch${msg.channel + 1}  CC${msg.controller} = ${msg.value}`) }
function onNoteOn(msg)  { addLog('MIDI', 'Note On',  `Ch${msg.channel + 1}  Note ${msg.note}  vel ${msg.velocity}`) }
function onNoteOff(msg) { addLog('MIDI', 'Note Off', `Ch${msg.channel + 1}  Note ${msg.note}`) }
function onSysExIn(data){ addLog('MIDI', 'SysEx In', hexStr(data)) }
function onSysExOut()   { /* already logged in doSendSysEx */ }

onMounted(() => {
  on('cc',      onCC)
  on('noteon',  onNoteOn)
  on('noteoff', onNoteOff)
  on('sysex',   onSysExIn)
})
onUnmounted(() => {
  off('cc',      onCC)
  off('noteon',  onNoteOn)
  off('noteoff', onNoteOff)
  off('sysex',   onSysExIn)
})

// ── WebSocket relay (server → client, used when Web MIDI not in browser) ─────

wsOn('midi:cc',      msg => { if (!midiIsConnected()) addLog('WS', 'CC',       `Ch${msg.channel + 1}  CC${msg.controller} = ${msg.value}`) })
wsOn('midi:noteon',  msg => { if (!midiIsConnected()) addLog('WS', 'Note On',  `Ch${msg.channel + 1}  Note ${msg.note}  vel ${msg.velocity}`) })
wsOn('midi:noteoff', msg => { if (!midiIsConnected()) addLog('WS', 'Note Off', `Ch${msg.channel + 1}  Note ${msg.note}`) })
wsOn('midi:sysex',   msg => { if (!midiIsConnected()) addLog('WS', 'SysEx In', hexStr(msg.data ?? [])) })
wsOn('midi:out',     ()  => { /* flash only, logged at send time */ })

// ── Send CC ───────────────────────────────────────────────────────────────────

const ccChannel    = ref(0)
const ccController = ref(74)
const ccValue      = ref(64)

function doSendCC() {
  sendCC(ccChannel.value, ccController.value, ccValue.value)
  addLog('→', 'CC Sent', `Ch${ccChannel.value + 1}  CC${ccController.value} = ${ccValue.value}`)
}

// ── Send Note ─────────────────────────────────────────────────────────────────

const noteChannel  = ref(0)
const noteNumber   = ref(60)
const noteVelocity = ref(100)

function doNoteOn() {
  sendNoteOn(noteChannel.value, noteNumber.value, noteVelocity.value)
  addLog('→', 'Note On', `Ch${noteChannel.value + 1}  Note ${noteNumber.value}  vel ${noteVelocity.value}`)
}
function doNoteOff() {
  sendNoteOff(noteChannel.value, noteNumber.value)
  addLog('→', 'Note Off', `Ch${noteChannel.value + 1}  Note ${noteNumber.value}`)
}

// ── Send SysEx ────────────────────────────────────────────────────────────────

const sysexInput = ref('F0 00 20 29 01 64 63 00 F7')
const sysexError = ref('')

async function doSendSysEx() {
  sysexError.value = ''
  const parts = sysexInput.value.trim().split(/[\s,]+/).filter(Boolean)
  const bytes = []
  for (const p of parts) {
    const n = parseInt(p, 16)
    if (isNaN(n) || n < 0 || n > 255) { sysexError.value = `Invalid byte: "${p}"`; return }
    bytes.push(n)
  }
  if (!bytes.length) { sysexError.value = 'Empty message'; return }
  if (bytes[0] !== 0xF0 || bytes[bytes.length - 1] !== 0xF7) {
    sysexError.value = 'Must start with F0 and end with F7'
    return
  }
  await sendSysEx(bytes)
  addLog('→', 'SysEx Out', hexStr(bytes))
}

// ── Quick SysEx presets ───────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Request Current Patch (Synth 1)', hex: 'F0 00 20 29 01 64 63 00 F7' },
  { label: 'Request Current Patch (Synth 2)', hex: 'F0 00 20 29 01 64 63 01 F7' },
  { label: 'Request Patch 1 (Synth 1)',        hex: 'F0 00 20 29 01 64 40 00 00 F7' },
  { label: 'Device Inquiry',                   hex: 'F0 7E 7F 06 01 F7' },
]

const webMidiAvailable = computed(() => midiIsConnected())
</script>

<template>
  <div class="midi-tester">

    <!-- Left: controls -->
    <div class="midi-tester__controls">

      <!-- Status -->
      <section class="midi-tester__section">
        <h3 class="midi-tester__heading">Connection</h3>
        <div class="midi-tester__status-row">
          <span class="midi-tester__dot" :class="device.connected ? 'dot--on' : 'dot--off'" />
          <span>{{ device.connected ? device.portName : 'Not connected' }}</span>
          <span class="midi-tester__badge" :class="webMidiAvailable ? 'badge--ok' : 'badge--ws'">
            {{ webMidiAvailable ? 'Web MIDI' : 'Server relay' }}
          </span>
        </div>
      </section>

      <!-- Send CC -->
      <section class="midi-tester__section">
        <h3 class="midi-tester__heading">Send CC</h3>
        <div class="midi-tester__row">
          <label class="midi-tester__label">
            Ch
            <input type="number" v-model.number="ccChannel" min="0" max="15" class="midi-tester__num" />
          </label>
          <label class="midi-tester__label">
            CC#
            <input type="number" v-model.number="ccController" min="0" max="127" class="midi-tester__num" />
          </label>
          <label class="midi-tester__label">
            Value
            <input type="number" v-model.number="ccValue" min="0" max="127" class="midi-tester__num" />
          </label>
          <button class="midi-tester__btn" :disabled="!device.connected" @click="doSendCC">Send</button>
        </div>
        <input type="range" v-model.number="ccValue" min="0" max="127" class="midi-tester__slider" />
      </section>

      <!-- Send Note -->
      <section class="midi-tester__section">
        <h3 class="midi-tester__heading">Send Note</h3>
        <div class="midi-tester__row">
          <label class="midi-tester__label">
            Ch
            <input type="number" v-model.number="noteChannel" min="0" max="15" class="midi-tester__num" />
          </label>
          <label class="midi-tester__label">
            Note
            <input type="number" v-model.number="noteNumber" min="0" max="127" class="midi-tester__num" />
          </label>
          <label class="midi-tester__label">
            Vel
            <input type="number" v-model.number="noteVelocity" min="1" max="127" class="midi-tester__num" />
          </label>
          <button class="midi-tester__btn midi-tester__btn--green" :disabled="!device.connected" @click="doNoteOn">On</button>
          <button class="midi-tester__btn" :disabled="!device.connected" @click="doNoteOff">Off</button>
        </div>
      </section>

      <!-- Send SysEx -->
      <section class="midi-tester__section">
        <h3 class="midi-tester__heading">Send SysEx</h3>
        <div class="midi-tester__row">
          <input
            v-model="sysexInput"
            class="midi-tester__sysex-input"
            placeholder="F0 … F7  (hex bytes, space-separated)"
            spellcheck="false"
            @keydown.enter="doSendSysEx"
          />
          <button class="midi-tester__btn" :disabled="!device.connected" @click="doSendSysEx">Send</button>
        </div>
        <div v-if="sysexError" class="midi-tester__error">{{ sysexError }}</div>
        <div class="midi-tester__presets">
          <button
            v-for="p in PRESETS"
            :key="p.label"
            class="midi-tester__preset-btn"
            @click="sysexInput = p.hex; sysexError = ''"
          >{{ p.label }}</button>
        </div>
      </section>

    </div>

    <!-- Right: log -->
    <div class="midi-tester__log-panel">
      <div class="midi-tester__log-header">
        <span class="midi-tester__log-title">Message Log</span>
        <span class="midi-tester__log-count">{{ log.length }} / {{ MAX_LOG }}</span>
        <button class="midi-tester__btn midi-tester__btn--sm" @click="log = []">Clear</button>
      </div>
      <div class="midi-tester__log">
        <div v-if="!log.length" class="midi-tester__log-empty">Waiting for MIDI messages…</div>
        <div
          v-for="entry in log"
          :key="entry.id"
          class="midi-tester__entry"
          :class="entry.source === '→' ? 'entry--out' : 'entry--in'"
        >
          <span class="entry__time">{{ entry.time }}</span>
          <span class="entry__src">{{ entry.source }}</span>
          <span class="entry__type">{{ entry.type }}</span>
          <span class="entry__data">{{ entry.data }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.midi-tester {
  display: flex;
  gap: var(--spacing-md);
  height: 100%;
  overflow: hidden;
}

/* ── Controls ────────────────────────────────────────────────────────────────── */

.midi-tester__controls {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
}

.midi-tester__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.midi-tester__heading {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin: 0 0 2px;
}

.midi-tester__status-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
}

.midi-tester__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot--on  { background: var(--color-success); box-shadow: 0 0 6px var(--color-success); }
.dot--off { background: var(--color-text-muted); }

.midi-tester__badge {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}
.badge--ok { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); }
.badge--ws { background: color-mix(in srgb, var(--color-accent) 15%, transparent); color: var(--color-accent); border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent); }

.midi-tester__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.midi-tester__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.midi-tester__num {
  width: 52px;
  padding: 2px 4px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.82rem;
  font-family: var(--font-mono);
  text-align: right;
}
.midi-tester__num:focus { outline: none; border-color: var(--color-accent); }

.midi-tester__slider {
  width: 100%;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.midi-tester__btn {
  padding: 3px 10px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: border-color var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}
.midi-tester__btn:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
.midi-tester__btn:disabled { opacity: 0.35; cursor: default; }
.midi-tester__btn--green:not(:disabled) { border-color: var(--color-success); color: var(--color-success); }
.midi-tester__btn--sm { padding: 2px 8px; font-size: 0.7rem; }

.midi-tester__sysex-input {
  flex: 1;
  padding: 3px 6px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  min-width: 0;
}
.midi-tester__sysex-input:focus { outline: none; border-color: var(--color-accent); }

.midi-tester__error {
  font-size: 0.75rem;
  color: var(--color-error);
}

.midi-tester__presets {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.midi-tester__preset-btn {
  text-align: left;
  padding: 3px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.72rem;
  transition: all var(--transition-fast);
}
.midi-tester__preset-btn:hover { border-color: var(--color-accent); color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 8%, transparent); }

/* ── Log ─────────────────────────────────────────────────────────────────────── */

.midi-tester__log-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  min-width: 0;
}

.midi-tester__log-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.midi-tester__log-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.midi-tester__log-count {
  font-size: 0.68rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  margin-left: auto;
}

.midi-tester__log {
  flex: 1;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.midi-tester__log-empty {
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-family: inherit;
}

.midi-tester__entry {
  display: grid;
  grid-template-columns: 100px 40px 90px 1fr;
  gap: 0 var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
  align-items: baseline;
}
.midi-tester__entry:hover { background: var(--color-surface-2); }

.entry--out { background: color-mix(in srgb, var(--color-accent) 5%, transparent); }

.entry__time { color: var(--color-text-muted); font-size: 0.68rem; }
.entry__src  { color: var(--color-text-muted); font-weight: 700; }
.entry--out .entry__src { color: var(--color-accent); }
.entry__type { color: var(--color-text); font-weight: 600; }
.entry__data { color: var(--color-text-muted); word-break: break-all; }

@media (max-width: 900px) {
  .midi-tester {
    flex-direction: column;
  }
  .midi-tester__controls {
    width: 100%;
    flex-shrink: unset;
    max-height: 55%;
  }
}
</style>
