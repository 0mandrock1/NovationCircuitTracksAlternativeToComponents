import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sendCC, on, isConnected } from '@/composables/useMidi.js'

// Source: Circuit Tracks Programmer's Reference Guide v3
//
// MIDI channel map (0-indexed):
//   Synth 1 → Ch 1 (idx 0)   Synth 2 → Ch 2 (idx 1)
//   Drum 1  → Ch 6 (idx 5)   Drum 2  → Ch 7 (idx 6)
//   Drum 3  → Ch 8 (idx 7)   Drum 4  → Ch 9 (idx 8)
//   Session → Ch 16 (idx 15) — global mixer volumes
//
// Session Control CCs on Ch 16:
//   CC 7  = Synth 1 Volume    CC 8  = Synth 2 Volume
//   CC 9  = Drum 1 Volume     CC 10 = Drum 2 Volume
//   CC 11 = Drum 3 Volume     CC 12 = Drum 4 Volume
//
// Per drum channel (Ch 6–9):
//   CC 7  = Level   CC 10 = Pan   CC 91 = Distortion   CC 93 = Chorus
//
// Per synth channel (Ch 1–2):
//   CC 10 = Pan   CC 91 = Distortion Level   CC 93 = Chorus Level
//   NOTE: CC 7 on Ch 1–2 is NOT defined in the spec — volume only via Session Control Ch 16
//
// Macro knobs (Ch 1 for Synth 1, Ch 2 for Synth 2):
//   CC 80–87 = Macro 1–8

const SESSION_CH    = 15  // 0-indexed Ch 16
const DRUM_CH_MIN   = 5   // drum tracks: idx 5–8 (Ch 6–9)
const MACRO_CC_BASE = 80  // CC 80–87 = Macro 1–8
const SYNC_INTERVAL_MS = 5000

// Per track: { name, midiCh (0-idx, null = no MIDI channel), sessionVolCC }
const TRACK_DEFS = [
  { name: 'Synth 1', midiCh: 0,    sessionVolCC: 7  },
  { name: 'Synth 2', midiCh: 1,    sessionVolCC: 8  },
  { name: 'MIDI 1',  midiCh: null,  sessionVolCC: null },
  { name: 'MIDI 2',  midiCh: null,  sessionVolCC: null },
  { name: 'MIDI 3',  midiCh: null,  sessionVolCC: null },
  { name: 'MIDI 4',  midiCh: null,  sessionVolCC: null },
  { name: 'Drum 1',  midiCh: 5,    sessionVolCC: 9  },
  { name: 'Drum 2',  midiCh: 6,    sessionVolCC: 10 },
  { name: 'Drum 3',  midiCh: 7,    sessionVolCC: 11 },
  { name: 'Drum 4',  midiCh: 8,    sessionVolCC: 12 },
]

function createChannel(def) {
  return {
    name:         def.name,
    midiCh:       def.midiCh,
    sessionVolCC: def.sessionVolCC,
    volume:       100,
    pan:          64,   // 0–127, centre = 64
    distortion:   0,
    chorus:       0,
    muted:        false,
    soloed:       false,
  }
}

export const useMixerStore = defineStore('mixer', () => {
  const channels = ref(TRACK_DEFS.map(createChannel))
  const macros   = ref(Array(8).fill(0))

  // ── Outgoing CC ────────────────────────────────────────────────────────────

  function setVolume(index, value) {
    channels.value[index].volume = value
    const ch = channels.value[index]
    if (ch.sessionVolCC !== null) {
      sendCC(SESSION_CH, ch.sessionVolCC, value)
    }
    // CC 7 = Level is only defined on drum channels (Ch 6–9, idx ≥ 5)
    // Synth channels (Ch 1–2) have no per-channel volume CC in the spec
    if (ch.midiCh !== null && ch.midiCh >= DRUM_CH_MIN) {
      sendCC(ch.midiCh, 7, value)
    }
  }

  function setPan(index, value) {
    channels.value[index].pan = value
    const ch = channels.value[index]
    if (ch.midiCh !== null) {
      sendCC(ch.midiCh, 10, value)
    }
  }

  function setDistortion(index, value) {
    channels.value[index].distortion = value
    const ch = channels.value[index]
    if (ch.midiCh !== null) {
      sendCC(ch.midiCh, 91, value)
    }
  }

  function setChorus(index, value) {
    channels.value[index].chorus = value
    const ch = channels.value[index]
    if (ch.midiCh !== null) {
      sendCC(ch.midiCh, 93, value)
    }
  }

  function toggleMute(index) {
    channels.value[index].muted = !channels.value[index].muted
  }

  function toggleSolo(index) {
    channels.value[index].soloed = !channels.value[index].soloed
  }

  // ── Push current UI state to device (синхронизация UI → устройство) ────────
  //
  // Отправляет все текущие значения микшера на устройство.
  // Вызывается при подключении и периодически каждые SYNC_INTERVAL_MS.
  // Удерживает устройство в синхронии с UI после переподключения или
  // смены патча.

  function syncToDevice() {
    for (const ch of channels.value) {
      if (ch.sessionVolCC !== null) {
        sendCC(SESSION_CH, ch.sessionVolCC, ch.volume)
      }
      if (ch.midiCh !== null) {
        if (ch.midiCh >= DRUM_CH_MIN) sendCC(ch.midiCh, 7, ch.volume)
        sendCC(ch.midiCh, 10, ch.pan)
        sendCC(ch.midiCh, 91, ch.distortion)
        sendCC(ch.midiCh, 93, ch.chorus)
      }
    }
  }

  // ── Periodic sync timer ────────────────────────────────────────────────────

  let _syncTimer = null

  function _startSync() {
    _stopSync()
    syncToDevice()
    _syncTimer = setInterval(syncToDevice, SYNC_INTERVAL_MS)
  }

  function _stopSync() {
    if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null }
  }

  on('connected',    _startSync)
  on('disconnected', _stopSync)

  // Если store инициализируется когда соединение уже открыто
  if (isConnected()) _startSync()

  // ── Pull: входящие CC от устройства → обновление UI ───────────────────────

  function applyIncomingCC(midiCh, controller, value) {
    // Session Control — глобальные уровни треков
    if (midiCh === SESSION_CH) {
      const track = channels.value.find(ch => ch.sessionVolCC === controller)
      if (track) track.volume = value
      return
    }

    // Macro knobs на синт-каналах (CC 80–87)
    if (midiCh === 0 || midiCh === 1) {
      const macroIdx = controller - MACRO_CC_BASE
      if (macroIdx >= 0 && macroIdx <= 7) {
        macros.value[macroIdx] = value
        return
      }
    }

    // Per-channel контролы
    const track = channels.value.find(ch => ch.midiCh === midiCh)
    if (!track) return
    if (controller === 7)  track.volume     = value
    if (controller === 10) track.pan        = value
    if (controller === 91) track.distortion = value
    if (controller === 93) track.chorus     = value
  }

  on('cc', ({ channel, controller, value }) => {
    applyIncomingCC(channel, controller, value)
  })

  return {
    channels, macros,
    setVolume, setPan, setDistortion, setChorus,
    toggleMute, toggleSolo,
    syncToDevice,
    applyIncomingCC,
  }
})
