import { defineStore } from 'pinia'
import { ref } from 'vue'

function createChannel(name) {
  return { name, volume: 100, pan: 0, muted: false, soloed: false, reverbSend: 0, delaySend: 0 }
}

const CHANNEL_NAMES = ['Synth 1', 'Synth 2', 'MIDI 1', 'MIDI 2', 'MIDI 3', 'MIDI 4', 'Drum 1', 'Drum 2']

export const useMixerStore = defineStore('mixer', () => {
  const channels = ref(CHANNEL_NAMES.map(createChannel))
  const macros = ref(Array(8).fill(0))

  function setVolume(index, value) {
    channels.value[index].volume = value
  }

  function setPan(index, value) {
    channels.value[index].pan = value
  }

  function toggleMute(index) {
    channels.value[index].muted = !channels.value[index].muted
  }

  function toggleSolo(index) {
    channels.value[index].soloed = !channels.value[index].soloed
  }

  function setReverbSend(index, value) {
    channels.value[index].reverbSend = value
  }

  function setDelaySend(index, value) {
    channels.value[index].delaySend = value
  }

  function updateMacro(index, value) {
    macros.value[index] = value
  }

  return { channels, macros, setVolume, setPan, toggleMute, toggleSolo, setReverbSend, setDelaySend, updateMacro }
})
