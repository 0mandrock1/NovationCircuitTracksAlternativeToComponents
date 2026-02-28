import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TRACK_NAMES = ['Synth 1', 'Synth 2', 'MIDI 1', 'MIDI 2', 'MIDI 3', 'MIDI 4', 'Drum 1', 'Drum 2', 'Drum 3', 'Drum 4']

function createEmptyStep() {
  return { active: false, velocity: 100, length: 1, probability: 100, microtiming: 0 }
}

function createEmptyPattern(stepCount = 16) {
  return {
    stepCount,
    tracks: TRACK_NAMES.map(name => ({
      name,
      muted: false,
      steps: Array.from({ length: 32 }, createEmptyStep)
    }))
  }
}

export const useSequencerStore = defineStore('sequencer', () => {
  const patterns = ref(Array.from({ length: 8 }, () => createEmptyPattern()))
  const activePatternIndex = ref(0)
  const playingStep = ref(-1)
  // 'stopped' | 'playing' | 'continued'
  const transportState = ref('stopped')

  const activePattern = computed(() => patterns.value[activePatternIndex.value])

  function toggleStep(trackIndex, stepIndex) {
    const step = activePattern.value.tracks[trackIndex].steps[stepIndex]
    step.active = !step.active
  }

  function updateStep(trackIndex, stepIndex, data) {
    Object.assign(activePattern.value.tracks[trackIndex].steps[stepIndex], data)
  }

  function toggleMute(trackIndex) {
    activePattern.value.tracks[trackIndex].muted = !activePattern.value.tracks[trackIndex].muted
  }

  return { patterns, activePatternIndex, playingStep, transportState, activePattern, toggleStep, updateStep, toggleMute }
})
