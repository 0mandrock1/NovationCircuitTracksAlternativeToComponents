import { defineStore } from 'pinia'
import { ref } from 'vue'

// MIDI channel mapping (0-indexed): mixer channel index → MIDI channel number
// Synth 1 = ch 0, Synth 2 = ch 1, MIDI 1-4 = ch 2-5, Drum = ch 9
const MIDI_CHANNELS = [0, 1, 2, 3, 4, 5, 9, 9]

// Default CC numbers for 8 macro knobs (on channel 0 = Synth 1)
const MACRO_CC_NUMS = [1, 2, 5, 11, 12, 13, 71, 74]

function createChannel(name) {
  return { name, volume: 100, pan: 0, muted: false, soloed: false, reverbSend: 0, delaySend: 0 }
}

const CHANNEL_NAMES = ['Synth 1', 'Synth 2', 'MIDI 1', 'MIDI 2', 'MIDI 3', 'MIDI 4', 'Drum 1', 'Drum 2']

async function _postCC(channel, controller, value) {
  try {
    await fetch('/api/mixer/cc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, controller, value }),
    })
  } catch { /* no device connected — ignore */ }
}

export const useMixerStore = defineStore('mixer', () => {
  const channels = ref(CHANNEL_NAMES.map(createChannel))
  const macros = ref(Array(8).fill(0))

  function setVolume(index, value) {
    channels.value[index].volume = value
    _postCC(MIDI_CHANNELS[index], 7, value)
  }

  function setPan(index, value) {
    channels.value[index].pan = value
    // pan: -63..63 → MIDI CC 1..127 (center 0 → CC 64)
    _postCC(MIDI_CHANNELS[index], 10, value + 64)
  }

  function toggleMute(index) {
    channels.value[index].muted = !channels.value[index].muted
  }

  function toggleSolo(index) {
    channels.value[index].soloed = !channels.value[index].soloed
  }

  function setReverbSend(index, value) {
    channels.value[index].reverbSend = value
    _postCC(MIDI_CHANNELS[index], 91, value)
  }

  function setDelaySend(index, value) {
    channels.value[index].delaySend = value
    _postCC(MIDI_CHANNELS[index], 95, value)
  }

  function updateMacro(index, value) {
    macros.value[index] = value
  }

  // Apply incoming CC from device — updates state only, no re-send to avoid feedback loops
  function applyIncomingCC(channel, controller, value) {
    // Macro knobs arrive on channel 0 (Synth 1)
    if (channel === 0) {
      const macroIdx = MACRO_CC_NUMS.indexOf(controller)
      if (macroIdx !== -1) {
        macros.value[macroIdx] = value
        return
      }
    }
    const trackIdx = MIDI_CHANNELS.indexOf(channel)
    if (trackIdx === -1) return
    if (controller === 7)  channels.value[trackIdx].volume     = value
    if (controller === 10) channels.value[trackIdx].pan        = value - 64
    if (controller === 91) channels.value[trackIdx].reverbSend = value
    if (controller === 95) channels.value[trackIdx].delaySend  = value
  }

  return {
    channels, macros,
    setVolume, setPan, toggleMute, toggleSolo,
    setReverbSend, setDelaySend, updateMacro, applyIncomingCC,
  }
})
