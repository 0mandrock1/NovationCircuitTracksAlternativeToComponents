<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 64 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 127 },
  label: { type: String, default: '' },
  size: { type: Number, default: 48 }
})

const emit = defineEmits(['update:modelValue'])

const dragging = ref(false)
const startY = ref(0)
const startValue = ref(0)

const angle = computed(() => {
  const range = props.max - props.min
  const normalized = (props.modelValue - props.min) / range
  return -135 + normalized * 270
})

function onMousedown(e) {
  dragging.value = true
  startY.value = e.clientY
  startValue.value = props.modelValue
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('mouseup', onMouseup)
}

function onMousemove(e) {
  if (!dragging.value) return
  const delta = startY.value - e.clientY
  const range = props.max - props.min
  const newValue = Math.round(Math.max(props.min, Math.min(props.max, startValue.value + delta * (range / 200))))
  emit('update:modelValue', newValue)
}

function onMouseup() {
  dragging.value = false
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('mouseup', onMouseup)
}
</script>

<template>
  <div class="knob" :style="{ width: size + 'px', height: size + 'px' }">
    <svg
      :width="size"
      :height="size"
      @mousedown="onMousedown"
      class="knob__svg"
    >
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="size / 2 - 3"
        fill="var(--color-surface-3)"
        stroke="var(--color-border)"
        stroke-width="1.5"
      />
      <line
        :x1="size / 2"
        :y1="size / 2"
        :x2="size / 2 + (size / 2 - 8) * Math.sin((angle * Math.PI) / 180)"
        :y2="size / 2 - (size / 2 - 8) * Math.cos((angle * Math.PI) / 180)"
        stroke="var(--color-accent)"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <span v-if="label" class="knob__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.knob__svg {
  cursor: ns-resize;
}

.knob__label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
