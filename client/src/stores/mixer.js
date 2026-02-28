import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDeviceStore } from '@/stores/device'

// MIDI CC assignments for each channel (Circuit Tracks standard)
// Volume = CC7, Pan = CC10, ReverbSend = CC91, DelaySend = CC93
const MIDI_CC = { volume: 7, pan: 10, reverbSend: 91, delaySend: 93 }

const CHANNEL_NAMES = ['Synth 1', 'Synth 2', 'MIDI 1', 'MIDI 2', 'MIDI 3', 'MIDI 4', 'Drum 1', 'Drum 2']

function createChannel(name) {
  return { name, volume: 100, pan: 64, muted: false, soloed: false, reverbSend: 0, delaySend: 0 }
}

export const useMixerStore = defineStore('mixer', () => {
  const channels = ref(CHANNEL_NAMES.map(createChannel))
  const macros   = ref(Array.from({ length: 8 }, () => 0))

  // Send MIDI CC to server (fire-and-forget)
  function _sendCC(midiChannel, cc, value) {
    useDeviceStore().recordMidiOut()
    fetch('/api/device/cc', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ channel: midiChannel, controller: cc, value }),
    }).catch(() => {})
  }

  function setVolume(index, value) {
    channels.value[index].volume = value
    _sendCC(index, MIDI_CC.volume, value)
  }

  function setPan(index, value) {
    channels.value[index].pan = value
    _sendCC(index, MIDI_CC.pan, value)
  }

  function toggleMute(index) {
    channels.value[index].muted = !channels.value[index].muted
    // Mute implemented as volume 0 / restore
    _sendCC(index, MIDI_CC.volume, channels.value[index].muted ? 0 : channels.value[index].volume)
  }

  function toggleSolo(index) {
    const wasSoloed = channels.value[index].soloed
    channels.value.forEach((ch, i) => {
      ch.soloed = false
      if (!wasSoloed && i !== index) ch.muted = true
    })
    if (!wasSoloed) channels.value[index].soloed = true
    else channels.value.forEach(ch => { ch.muted = false })
  }

  function setReverbSend(index, value) {
    channels.value[index].reverbSend = value
    _sendCC(index, MIDI_CC.reverbSend, value)
  }

  function setDelaySend(index, value) {
    channels.value[index].delaySend = value
    _sendCC(index, MIDI_CC.delaySend, value)
  }

  function updateMacro(index, value) {
    macros.value[index] = value
  }

  // Update from WebSocket (incoming CC from device)
  function handleCC(msg) {
    const { channel, controller, value } = msg
    if (channel >= 0 && channel < channels.value.length) {
      if (controller === MIDI_CC.volume)    channels.value[channel].volume    = value
      if (controller === MIDI_CC.pan)       channels.value[channel].pan       = value
      if (controller === MIDI_CC.reverbSend) channels.value[channel].reverbSend = value
      if (controller === MIDI_CC.delaySend)  channels.value[channel].delaySend  = value
    }
  }

  return {
    channels, macros,
    setVolume, setPan, toggleMute, toggleSolo, setReverbSend, setDelaySend,
    updateMacro, handleCC,
  }
})
