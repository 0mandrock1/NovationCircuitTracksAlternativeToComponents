<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { sendNoteOn, sendNoteOff, isConnected } from '@/composables/useMidi.js'
import { usePatchesStore } from '@/stores/patches'

const store = usePatchesStore()

const octave   = ref(4)   // base octave — C4 = MIDI 60
const velocity = ref(100)

// MIDI channel: Synth 1 = ch 0, Synth 2 = ch 1
const channel = computed(() => store.activeTrack)

// ── Key layout ──────────────────────────────────────────────────────────────
// WHITE_W = width of one white key (px). BLACK_W/BLACK_H = black key dimensions.
const WHITE_W = 28
const BLACK_W = 16
const WHITE_H = 72
const BLACK_H = 44

// Build keys for `numOctaves` octaves starting at `octave`
// Returns { whites: [{note, label}], blacks: [{note, leftPx}] }
const keys = computed(() => {
  // Semitone → {white index within octave, black? and left-fraction}
  // Black key left (in px from start of octave) = fraction * WHITE_W - BLACK_W/2
  const BLACK_FRACS = { 1: 0.72, 3: 1.72, 6: 3.72, 8: 4.72, 10: 5.72 }
  const WHITE_SEMIS = [0, 2, 4, 5, 7, 9, 11]
  const NOTE_NAMES  = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const whites = [], blacks = []

  for (let o = 0; o < 2; o++) {
    const midiBase   = (octave.value + o + 1) * 12
    const octPxStart = o * 7 * WHITE_W

    WHITE_SEMIS.forEach((s, wi) => {
      const note = midiBase + s
      whites.push({ note, label: wi === 0 ? NOTE_NAMES[s] + (octave.value + o) : '' })
    })

    Object.entries(BLACK_FRACS).forEach(([semi, frac]) => {
      const s    = Number(semi)
      const note = midiBase + s
      const left = octPxStart + frac * WHITE_W - BLACK_W / 2
      blacks.push({ note, left })
    })
  }
  return { whites, blacks }
})

// ── Note tracking ──────────────────────────────────────────────────────────
// activeNotes: Set of MIDI note numbers currently held (for visual state)
// noteChannels: Map<note, channel> — records which channel each NoteOn was sent on
//   so that NoteOff always goes to the same channel even if activeTrack changes mid-hold
const activeNotes  = ref(new Set())
const noteChannels = new Map()

function triggerOn(note) {
  if (!isConnected() || activeNotes.value.has(note)) return
  const ch = channel.value
  noteChannels.set(note, ch)
  activeNotes.value = new Set(activeNotes.value).add(note)
  sendNoteOn(ch, note, velocity.value)
}

function triggerOff(note) {
  if (!activeNotes.value.has(note)) return
  const ch = noteChannels.get(note) ?? channel.value
  noteChannels.delete(note)
  const next = new Set(activeNotes.value)
  next.delete(note)
  activeNotes.value = next
  sendNoteOff(ch, note, 0)
}

function allOff() {
  for (const n of activeNotes.value) {
    const ch = noteChannels.get(n) ?? channel.value
    sendNoteOff(ch, n, 0)
  }
  noteChannels.clear()
  activeNotes.value = new Set()
}

// ── Mouse / touch ───────────────────────────────────────────────────────────
const mouseDown = ref(false)

function onPointerDown(note, e) {
  e.preventDefault()
  mouseDown.value = true
  triggerOn(note)
}
function onPointerUp(note) {
  mouseDown.value = false
  triggerOff(note)
}
function onPointerCancel(note) {
  // Touch/pointer cancel (OS interruption, scroll, multi-touch) — treat as release
  mouseDown.value = false
  triggerOff(note)
}
function onPointerEnter(note) {
  if (mouseDown.value) triggerOn(note)
}
function onPointerLeave(note) {
  if (mouseDown.value) triggerOff(note)
}

// ── Keyboard shortcuts (active when keyboard section is focused) ────────────
// Mapping: white keys A-K = C D E F G A B C (low octave)
// Black keys: W=C# E=D# T=F# Y=G# U=A#
const KEY_SEMI = { a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11, k:12 }
const kbActive = ref(false)
const heldKeys  = new Set()

function onKeyDown(e) {
  if (!kbActive.value) return
  const k = e.key.toLowerCase()
  if (!(k in KEY_SEMI) || heldKeys.has(k)) return
  heldKeys.add(k)
  const note = (octave.value + 1) * 12 + KEY_SEMI[k]
  triggerOn(note)
}

function onKeyUp(e) {
  const k = e.key.toLowerCase()
  if (!heldKeys.has(k)) return
  heldKeys.delete(k)
  const note = (octave.value + 1) * 12 + KEY_SEMI[k]
  triggerOff(note)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  // Release all notes on mouse-up or pointer-cancel outside the keyboard element
  window.addEventListener('mouseup', allOff)
  window.addEventListener('pointercancel', allOff)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mouseup', allOff)
  window.removeEventListener('pointercancel', allOff)
  allOff()
})

function shiftOctave(d) {
  octave.value = Math.max(1, Math.min(7, octave.value + d))
  allOff()
}
</script>

<template>
  <div class="mk" :class="{ 'mk--focused': kbActive }" @focusin="kbActive = true" @focusout="kbActive = false">
    <!-- Header -->
    <div class="mk__header">
      <span class="mk__label">
        {{ store.activeTrack === 0 ? 'Synth 1' : 'Synth 2' }} — Ch {{ channel + 1 }}
      </span>
      <span v-if="!isConnected()" class="mk__warn">connect device to hear sound</span>

      <div class="mk__controls">
        <button class="mk__ctrl-btn" @click="shiftOctave(-1)" :disabled="octave <= 1" title="Octave down">Oct −</button>
        <span class="mk__oct-label">C{{ octave }}</span>
        <button class="mk__ctrl-btn" @click="shiftOctave(1)"  :disabled="octave >= 7" title="Octave up">Oct +</button>

        <label class="mk__vel-label">Vel
          <input class="mk__vel-range" type="range" min="1" max="127" v-model.number="velocity" />
          <span class="mk__vel-val">{{ velocity }}</span>
        </label>

        <button class="mk__ctrl-btn mk__ctrl-btn--stop" @click="allOff" title="All notes off">■</button>
      </div>

      <span class="mk__kb-hint" :class="{ 'mk__kb-hint--active': kbActive }">
        {{ kbActive ? 'keyboard active · ASDFGHJK / WETYU' : 'click keyboard to enable key input' }}
      </span>
    </div>

    <!-- Piano keys -->
    <div
      class="mk__keys"
      tabindex="0"
      :style="{ width: (2 * 7 * WHITE_W) + 'px', height: WHITE_H + 'px' }"
      @focus="kbActive = true"
      @blur="kbActive = false"
    >
      <!-- White keys -->
      <button
        v-for="k in keys.whites"
        :key="k.note"
        class="mk__white"
        :class="{ 'mk__white--active': activeNotes.has(k.note) }"
        :style="{ width: WHITE_W + 'px', height: WHITE_H + 'px' }"
        :title="'Note ' + k.note"
        @pointerdown.prevent="onPointerDown(k.note, $event)"
        @pointerup="onPointerUp(k.note)"
        @pointercancel="onPointerCancel(k.note)"
        @pointerenter="onPointerEnter(k.note)"
        @pointerleave="onPointerLeave(k.note)"
      >
        <span v-if="k.label" class="mk__white-label">{{ k.label }}</span>
      </button>

      <!-- Black keys (absolutely positioned) -->
      <button
        v-for="k in keys.blacks"
        :key="k.note"
        class="mk__black"
        :class="{ 'mk__black--active': activeNotes.has(k.note) }"
        :style="{ width: BLACK_W + 'px', height: BLACK_H + 'px', left: k.left + 'px' }"
        :title="'Note ' + k.note"
        @pointerdown.prevent="onPointerDown(k.note, $event)"
        @pointerup="onPointerUp(k.note)"
        @pointercancel="onPointerCancel(k.note)"
        @pointerenter="onPointerEnter(k.note)"
        @pointerleave="onPointerLeave(k.note)"
      />
    </div>
  </div>
</template>

<style scoped>
.mk {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex-shrink: 0;
  user-select: none;
}

.mk--focused { border-color: var(--color-accent); }

/* ── Header row ─────────────────────────────────────────────────────────── */
.mk__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.mk__label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.mk__warn {
  font-size: 0.7rem;
  color: var(--color-warning, #ff9800);
  font-style: italic;
}

.mk__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.mk__ctrl-btn {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 2px 7px;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}
.mk__ctrl-btn:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
.mk__ctrl-btn:disabled { opacity: 0.3; cursor: default; }
.mk__ctrl-btn--stop { color: var(--color-error, #f44336); }
.mk__ctrl-btn--stop:hover { border-color: var(--color-error, #f44336) !important; }

.mk__oct-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text);
  min-width: 24px;
  text-align: center;
}

.mk__vel-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.mk__vel-range {
  width: 64px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.mk__vel-val {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-text-muted);
  min-width: 24px;
}

.mk__kb-hint {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  font-style: italic;
  flex-basis: 100%;
  order: 10;
}
.mk__kb-hint--active { color: var(--color-accent); font-style: normal; }

/* ── Keys container ─────────────────────────────────────────────────────── */
.mk__keys {
  position: relative;
  display: flex;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  overflow: visible;
  outline: none;
  flex-shrink: 0;
}

/* ── White keys ─────────────────────────────────────────────────────────── */
.mk__white {
  position: relative;
  flex-shrink: 0;
  background: #f8f8f2;
  border: 1px solid #888;
  border-top: none;
  border-radius: 0 0 3px 3px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
  transition: background 0.05s;
  z-index: 0;
  touch-action: none;
}

.mk__white:hover { background: #ededda; }
.mk__white--active { background: var(--color-accent) !important; }

.mk__white-label {
  font-size: 8px;
  font-family: var(--font-mono);
  color: #888;
  line-height: 1;
  pointer-events: none;
}

/* ── Black keys ─────────────────────────────────────────────────────────── */
.mk__black {
  position: absolute;
  top: 0;
  background: #1e1e2a;
  border: 1px solid #000;
  border-top: none;
  border-radius: 0 0 2px 2px;
  cursor: pointer;
  z-index: 1;
  padding: 0;
  transition: background 0.05s;
  touch-action: none;
}

.mk__black:hover { background: #2e2e42; }
.mk__black--active { background: var(--color-accent) !important; }
</style>
