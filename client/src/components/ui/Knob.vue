<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 64 },
  min:        { type: Number, default: 0   },
  max:        { type: Number, default: 127 },
  label:      { type: String, default: ''  },
  size:       { type: Number, default: 48  },
  color:      { type: String, default: 'var(--color-accent)' },
})

const emit = defineEmits(['update:modelValue'])

const dragging   = ref(false)
const editing    = ref(false)
const editValue  = ref('')
let startY = 0, startVal = 0

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const r  = computed(() => props.size / 2 - 3)

// Arc for track background and value indicator
const ARC_START = -225  // degrees (bottom-left)
const ARC_RANGE = 270

const angle = computed(() => {
  const norm = (props.modelValue - props.min) / (props.max - props.min)
  return ARC_START + norm * ARC_RANGE
})

function polarToXY(deg, radius) {
  const rad = (deg - 90) * (Math.PI / 180)
  return { x: cx.value + radius * Math.cos(rad), y: cy.value + radius * Math.sin(rad) }
}

function arcPath(fromDeg, toDeg, radius) {
  const from = polarToXY(fromDeg, radius)
  const to   = polarToXY(toDeg,   radius)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  const sweep = toDeg > fromDeg ? 1 : 0
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} ${sweep} ${to.x} ${to.y}`
}

const trackPath = computed(() => arcPath(ARC_START, ARC_START + ARC_RANGE, r.value - 1))
const valuePath = computed(() => {
  const toDeg = Math.max(ARC_START, angle.value)
  return arcPath(ARC_START, toDeg, r.value - 1)
})

const indicatorEnd = computed(() => polarToXY(angle.value, r.value - 5))

// ── Drag interaction ──────────────────────────────────────────────────────────
function onMousedown(e) {
  if (editing.value) return
  e.preventDefault()
  dragging.value = true
  startY   = e.clientY
  startVal = props.modelValue
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('mouseup',   onMouseup)
}

function onMousemove(e) {
  if (!dragging.value) return
  const delta   = startY - e.clientY
  const range   = props.max - props.min
  const speed   = e.shiftKey ? 0.2 : 1  // shift = fine control
  const newVal  = Math.round(Math.max(props.min, Math.min(props.max, startVal + delta * speed * (range / 150))))
  emit('update:modelValue', newVal)
}

function onMouseup() {
  dragging.value = false
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('mouseup',   onMouseup)
}

// ── Double-click to type a value ──────────────────────────────────────────────
function onDblclick() {
  editing.value = true
  editValue.value = String(props.modelValue)
}

function commitEdit() {
  const v = parseInt(editValue.value, 10)
  if (!isNaN(v)) emit('update:modelValue', Math.max(props.min, Math.min(props.max, v)))
  editing.value = false
}

// ── Scroll wheel ──────────────────────────────────────────────────────────────
function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY < 0 ? 1 : -1
  emit('update:modelValue', Math.max(props.min, Math.min(props.max, props.modelValue + delta)))
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('mouseup',   onMouseup)
})
</script>

<template>
  <div class="knob" :style="{ width: size + 'px' }" :title="`${label}: ${modelValue}`">
    <div class="knob__svg-wrap" @wheel.prevent="onWheel" @dblclick="onDblclick">
      <svg
        :width="size"
        :height="size"
        @mousedown="onMousedown"
        class="knob__svg"
        :class="{ 'knob__svg--dragging': dragging }"
      >
        <!-- Track background arc -->
        <path :d="trackPath" fill="none" stroke="var(--color-border)" stroke-width="2.5" stroke-linecap="round" />
        <!-- Value arc -->
        <path :d="valuePath" fill="none" :stroke="color" stroke-width="2.5" stroke-linecap="round" />
        <!-- Knob body -->
        <circle :cx="cx" :cy="cy" :r="r - 4" fill="var(--color-surface-3)" />
        <!-- Indicator line -->
        <line
          :x1="cx" :y1="cy"
          :x2="indicatorEnd.x" :y2="indicatorEnd.y"
          :stroke="color" stroke-width="2" stroke-linecap="round"
        />
      </svg>
    </div>

    <!-- Inline value edit on double-click -->
    <input
      v-if="editing"
      v-model="editValue"
      class="knob__edit"
      type="number"
      :min="min" :max="max"
      @keydown.enter="commitEdit"
      @keydown.escape="editing = false"
      @blur="commitEdit"
      v-focus
    />
    <span v-else class="knob__value">{{ modelValue }}</span>
    <span v-if="label" class="knob__label">{{ label }}</span>
  </div>
</template>

<script>
export default {
  directives: { focus: { mounted: (el) => el.focus() } }
}
</script>

<style scoped>
.knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  user-select: none;
}

.knob__svg-wrap { position: relative; }

.knob__svg { cursor: ns-resize; display: block; }
.knob__svg--dragging { cursor: grabbing; }

.knob__value {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-text-muted);
  line-height: 1;
}

.knob__edit {
  width: 36px;
  font-size: 0.65rem;
  text-align: center;
  background: var(--color-surface-2);
  border: 1px solid var(--color-accent);
  border-radius: 3px;
  color: var(--color-text);
  outline: none;
  padding: 1px 2px;
}

.knob__label {
  font-size: 0.62rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
