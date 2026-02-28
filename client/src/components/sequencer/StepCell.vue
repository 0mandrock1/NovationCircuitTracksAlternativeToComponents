<script setup>
import { ref, computed } from 'vue'
import { useSequencerStore } from '@/stores/sequencer'

const props = defineProps({
  step:       { type: Object, required: true },
  stepIndex:  { type: Number, required: true },
  trackIndex: { type: Number, required: true },
  isPlaying:  { type: Boolean, default: false },
  trackColor: { type: String, default: 'var(--color-accent)' }
})

const store = useSequencerStore()
const showParams = ref(false)

// Used by v-bind() in <style scoped>
const activeColor = computed(() => props.trackColor)

function onClick() {
  store.toggleStep(props.trackIndex, props.stepIndex)
}

function onContextMenu(e) {
  e.preventDefault()
  showParams.value = !showParams.value
}

function closeParams() {
  showParams.value = false
}

function onUpdate(key, value) {
  store.updateStep(props.trackIndex, props.stepIndex, { [key]: Number(value) })
}
</script>

<template>
  <div class="step-cell-wrap">
    <button
      class="step-cell"
      :class="{
        'step-cell--active': step.active,
        'step-cell--playing': isPlaying,
        'step-cell--beat': stepIndex % 4 === 0,
        'step-cell--has-params': step.active && (step.velocity !== 100 || step.probability !== 100 || step.microtiming !== 0)
      }"
      @click="onClick"
      @contextmenu="onContextMenu"
    />

    <div
      v-if="showParams"
      class="step-params"
    >
      <div class="step-params__row">
        <label>Velocity</label>
        <input type="range" min="1" max="127" :value="step.velocity" @input="onUpdate('velocity', $event.target.value)" />
        <span>{{ step.velocity }}</span>
      </div>
      <div class="step-params__row">
        <label>Length</label>
        <input type="range" min="1" max="32" :value="step.length" @input="onUpdate('length', $event.target.value)" />
        <span>{{ step.length }}</span>
      </div>
      <div class="step-params__row">
        <label>Prob %</label>
        <input type="range" min="0" max="100" :value="step.probability" @input="onUpdate('probability', $event.target.value)" />
        <span>{{ step.probability }}</span>
      </div>
      <div class="step-params__row">
        <label>Timing</label>
        <input type="range" min="-50" max="50" :value="step.microtiming" @input="onUpdate('microtiming', $event.target.value)" />
        <span>{{ step.microtiming }}</span>
      </div>
      <button class="step-params__close" @click="closeParams">✕</button>
    </div>
  </div>
</template>

<style scoped>
.step-cell-wrap {
  position: relative;
  flex-shrink: 0;
}

.step-cell {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  display: block;
}

.step-cell--beat {
  border-color: var(--color-surface-3);
}

.step-cell:hover {
  border-color: var(--color-text-muted);
}

.step-cell--active {
  background: v-bind(activeColor);
  border-color: v-bind(activeColor);
}

.step-cell--has-params::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  pointer-events: none;
}

.step-cell--playing {
  border-color: #fff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
}

.step-params {
  position: absolute;
  top: 32px;
  left: 0;
  z-index: 100;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  min-width: 180px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.step-params__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: 4px;
}

.step-params__row label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: 46px;
  flex-shrink: 0;
}

.step-params__row input[type=range] {
  flex: 1;
  accent-color: v-bind(activeColor);
}

.step-params__row span {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-dim);
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.step-params__close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.65rem;
}

.step-params__close:hover {
  color: var(--color-text);
}
</style>
