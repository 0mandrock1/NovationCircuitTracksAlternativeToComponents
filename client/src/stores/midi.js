import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_CC = [1, 2, 5, 11, 12, 13, 71, 74]

function createTemplate(name) {
  return { name, macroCC: [...DEFAULT_CC] }
}

export const useMidiStore = defineStore('midi', () => {
  const templates = ref(Array.from({ length: 8 }, (_, i) => createTemplate(`Template ${i + 1}`)))
  const trackRouting = ref([1, 2, 3, 4])
  const clockIn = ref(false)
  const clockOut = ref(false)

  function setMacroCC(templateIndex, macroIndex, cc) {
    templates.value[templateIndex].macroCC[macroIndex] = cc
  }

  function setTrackChannel(trackIndex, channel) {
    trackRouting.value[trackIndex] = channel
  }

  return { templates, trackRouting, clockIn, clockOut, setMacroCC, setTrackChannel }
})
