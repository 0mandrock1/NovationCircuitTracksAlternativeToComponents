import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { on, sendNoteOn, sendNoteOff } from '@/composables/useMidi.js'

const TRACK_NAMES = ['Synth 1', 'Synth 2', 'MIDI 1', 'MIDI 2', 'MIDI 3', 'MIDI 4', 'Drum 1', 'Drum 2', 'Drum 3', 'Drum 4']

// 0-indexed MIDI channels per track (null = no MIDI output, e.g. MIDI 1-4 routed externally)
// Synth 1=Ch1(0), Synth 2=Ch2(1), MIDI 1-4=null, Drum 1-4=Ch6-9(5-8)
const TRACK_MIDI_CH = [0, 1, null, null, null, null, 5, 6, 7, 8]

function createEmptyStep() {
  return { active: false, velocity: 100, length: 1, probability: 100, microtiming: 0, note: 60 }
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

  // WebSocket fallback setters
  function setPlayingStep(step)    { playingStep.value    = step }
  function setTransportState(state) { transportState.value = state }

  // ── MIDI note engine ────────────────────────────────────────────────────────
  // Tracks active notes: Map<`ch-note`, stepsRemaining>
  const _activeNotes = new Map()

  function _triggerStep(stepIdx) {
    const pat = activePattern.value
    if (!pat || stepIdx >= pat.stepCount) return
    for (let trackIdx = 0; trackIdx < pat.tracks.length; trackIdx++) {
      const ch = TRACK_MIDI_CH[trackIdx]
      if (ch === null) continue
      const track = pat.tracks[trackIdx]
      if (track.muted) continue
      const step = track.steps[stepIdx]
      if (!step?.active) continue
      if (step.probability < 100 && Math.random() * 100 > step.probability) continue
      const note = step.note ?? 60
      const vel  = step.velocity ?? 100
      sendNoteOn(ch, note, vel)
      _activeNotes.set(`${ch}-${note}`, Math.max(1, step.length ?? 1))
    }
  }

  function _tickNoteOffs() {
    const toDelete = []
    for (const [key, stepsLeft] of _activeNotes) {
      const next = stepsLeft - 1
      if (next <= 0) toDelete.push(key)
      else _activeNotes.set(key, next)
    }
    for (const key of toDelete) {
      const [ch, note] = key.split('-').map(Number)
      sendNoteOff(ch, note, 0)
      _activeNotes.delete(key)
    }
  }

  function _allNotesOff() {
    for (const key of _activeNotes.keys()) {
      const [ch, note] = key.split('-').map(Number)
      sendNoteOff(ch, note, 0)
    }
    _activeNotes.clear()
  }

  on('transport', (state) => {
    if (state === 'start')    { transportState.value = 'playing';   playingStep.value = -1 }
    if (state === 'continue') { transportState.value = 'continued' }
    if (state === 'stop')     { transportState.value = 'stopped';   playingStep.value = -1; _allNotesOff() }
  })

  on('clock:step', (step) => {
    _tickNoteOffs()
    playingStep.value = step
    if (transportState.value === 'playing' || transportState.value === 'continued') {
      _triggerStep(step)
    }
  })

  return {
    patterns, activePatternIndex, playingStep, transportState, activePattern,
    toggleStep, updateStep, toggleMute,
    setPlayingStep, setTransportState,
  }
})
