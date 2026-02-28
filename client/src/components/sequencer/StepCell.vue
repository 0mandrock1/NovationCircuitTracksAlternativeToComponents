<script setup>
import { ref } from 'vue'
import { useSequencerStore } from '@/stores/sequencer'

const props = defineProps({
  step:       { type: Object,  required: true },
  stepIndex:  { type: Number,  required: true },
  trackIndex: { type: Number,  required: true },
  isPlaying:  { type: Boolean, default: false },
  trackColor: { type: String,  default: 'var(--color-accent)' },
})

const store    = useSequencerStore()
const showMenu = ref(false)
const menuPos  = ref({ x: 0, y: 0 })

function onClick() {
  store.toggleStep(props.trackIndex, props.stepIndex)
}

function onContextMenu(e) {
  e.preventDefault()
  // Adjust so menu doesn't go off-screen
  const margin = 4
  const mw = 230, mh = 200
  menuPos.value = {
    x: Math.min(e.clientX, window.innerWidth  - mw - margin),
    y: Math.min(e.clientY, window.innerHeight - mh - margin),
  }
  showMenu.value = true
}

function updateStep(field, value) {
  store.updateStep(props.trackIndex, props.stepIndex, { [field]: Number(value) })
}
</script>

<template>
  <div class="scp">
    <button
      class="step-cell"
      :class="{
        'step-cell--active':  step.active,
        'step-cell--playing': isPlaying,
        'step-cell--beat':    stepIndex % 4 === 0,
      }"
      :style="step.active ? { background: trackColor, borderColor: trackColor } : {}"
      :title="`Step ${stepIndex + 1} | vel:${step.velocity} prob:${step.probability}%`"
      @click="onClick"
      @contextmenu.prevent="onContextMenu"
    />

    <!-- Step params popup -->
    <Teleport to="body">
      <div v-if="showMenu" class="step-menu__backdrop" @click="showMenu = false" />
      <div
        v-if="showMenu"
        class="step-menu"
        :style="{ left: menuPos.x + 'px', top: menuPos.y + 'px' }"
        @click.stop
      >
        <div class="step-menu__title">Step {{ stepIndex + 1 }}</div>

        <div class="step-menu__row">
          <span>Velocity</span>
          <input type="range" min="1" max="127" :value="step.velocity"
            @input="updateStep('velocity', $event.target.value)" />
          <span class="step-menu__val">{{ step.velocity }}</span>
        </div>

        <div class="step-menu__row">
          <span>Length</span>
          <input type="range" min="1" max="8" step="0.5" :value="step.length"
            @input="updateStep('length', $event.target.value)" />
          <span class="step-menu__val">{{ step.length }}</span>
        </div>

        <div class="step-menu__row">
          <span>Probability</span>
          <input type="range" min="0" max="100" :value="step.probability"
            @input="updateStep('probability', $event.target.value)" />
          <span class="step-menu__val">{{ step.probability }}%</span>
        </div>

        <div class="step-menu__row">
          <span>Microtiming</span>
          <input type="range" min="-8" max="8" :value="step.microtiming"
            @input="updateStep('microtiming', $event.target.value)" />
          <span class="step-menu__val">{{ step.microtiming > 0 ? '+' : '' }}{{ step.microtiming }}</span>
        </div>

        <button class="step-menu__close" @click="showMenu = false">Close</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.scp { position: relative; }

.step-cell {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
  padding: 0;
  display: block;
}

.step-cell--beat  { border-color: var(--color-surface-3); }
.step-cell:hover  { border-color: var(--color-text-muted); }
.step-cell--playing {
  border-color: #fff !important;
  box-shadow: 0 0 6px rgba(255,255,255,0.5);
}
</style>

<style>
.step-menu {
  position: fixed;
  z-index: 1000;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  min-width: 230px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

.step-menu__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.step-menu__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 6px;
  font-size: 0.78rem;
  color: var(--color-text-dim);
}

.step-menu__row > span:first-child { width: 80px; flex-shrink: 0; }
.step-menu__row input[type=range] { flex: 1; accent-color: var(--color-accent); cursor: pointer; }

.step-menu__val {
  width: 36px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.step-menu__close {
  margin-top: var(--spacing-sm);
  width: 100%;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--transition-fast);
}
.step-menu__close:hover { border-color: var(--color-accent); color: var(--color-accent); }

.step-menu__backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}
</style>
