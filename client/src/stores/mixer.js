import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sendCC, on } from '@/composables/useMidi.js'

// Source: Circuit Tracks Programmer's Reference Guide v3
//
// MIDI channel map (0-indexed):
//   Synth 1 → Ch 1 (idx 0)   Synth 2 → Ch 2 (idx 1)
//   Drum 1  → Ch 6 (idx 5)   Drum 2  → Ch 7 (idx 6)
//   Drum 3  → Ch 8 (idx 7)   Drum 4  → Ch 9 (idx 8)
//   Session → Ch 16 (idx 15)  — global mixer volumes
//
// Session Control CCs on Ch 16:
//   CC 7  = Synth 1 Volume    CC 8  = Synth 2 Volume
//   CC 9  = Drum 1 Volume     CC 10 = Drum 2 Volume
//   CC 11 = Drum 3 Volume     CC 12 = Drum 4 Volume
//
// Per-channel CCs (synth Ch1/2, drum Ch6–9):
//   CC 7  = Level   CC 10 = Pan
//   CC 91 = Distortion Level   CC 93 = Chorus Level
//
// Macro knob positions (Ch 1 for Synth1, Ch 2 for Synth2):
//   CC 80–87 = Macro 1–8

const SESSION_CH = 15  // 0-indexed Ch 16

// Per track: { name, midiCh (0-idx, null = MIDI passthrough), sessionVolCC }
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

const MACRO_CC_BASE = 80  // CC 80–87 = Macro 1–8

function createChannel(def) {
  return {
    name:        def.name,
    midiCh:      def.midiCh,
    sessionVolCC: def.sessionVolCC,
    volume:      100,
    pan:         64,   // 0–127, centre = 64
    distortion:  0,
    chorus:      0,
    muted:       false,
    soloed:      false,
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
      // Session Control: global volume on Ch 16
      sendCC(SESSION_CH, ch.sessionVolCC, value)
    }
    if (ch.midiCh !== null) {
      // Also send on own channel (redundant but some MIDI devices expect it)
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

  // ── Incoming CC from device ────────────────────────────────────────────────

  function applyIncomingCC(midiCh, controller, value) {
    // Session Control — volumes
    if (midiCh === SESSION_CH) {
      const track = channels.value.find(ch => ch.sessionVolCC === controller)
      if (track) track.volume = value
      return
    }

    // Macro knobs on synth channels (CC 80–87)
    if (midiCh === 0 || midiCh === 1) {
      const macroIdx = controller - MACRO_CC_BASE
      if (macroIdx >= 0 && macroIdx <= 7) {
        macros.value[macroIdx] = value
        return
      }
    }

    // Per-channel controls
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
    applyIncomingCC,
  }
})
