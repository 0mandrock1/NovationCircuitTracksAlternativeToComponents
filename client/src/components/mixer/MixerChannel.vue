<script setup>
import { useMixerStore } from '@/stores/mixer'
import Knob from '@/components/ui/Knob.vue'

const props = defineProps({
  channel:    { type: Object, required: true },
  index:      { type: Number, required: true },
  trackColor: { type: String, default: 'var(--color-accent)' },
})

const store = useMixerStore()
</script>

<template>
  <div
    class="mc"
    :class="{ 'mc--muted': channel.muted, 'mc--soloed': channel.soloed }"
    :style="{ '--track-color': trackColor }"
  >
    <!-- Name -->
    <div class="mc__name" :title="channel.name">{{ channel.name }}</div>

    <!-- Reverb + Delay sends (small knobs at top) -->
    <div class="mc__sends">
      <Knob
        :model-value="channel.reverbSend"
        @update:model-value="store.setReverbSend(index, $event)"
        label="Rev"
        :size="32"
        color="var(--color-info)"
      />
      <Knob
        :model-value="channel.delaySend"
        @update:model-value="store.setDelaySend(index, $event)"
        label="Dly"
        :size="32"
        color="var(--color-warning)"
      />
    </div>

    <!-- Pan knob -->
    <Knob
      :model-value="channel.pan"
      @update:model-value="store.setPan(index, $event)"
      label="Pan"
      :size="36"
      :min="0"
      :max="127"
      :color="trackColor"
    />

    <!-- Volume fader (vertical) -->
    <div class="mc__fader-wrap">
      <div class="mc__fader-track">
        <div
          class="mc__fader-fill"
          :style="{ height: (channel.volume / 127 * 100) + '%', background: trackColor }"
        />
      </div>
      <input
        type="range"
        class="mc__fader"
        orient="vertical"
        min="0" max="127"
        :value="channel.volume"
        @input="store.setVolume(index, Number($event.target.value))"
      />
    </div>

    <!-- Volume value -->
    <div class="mc__vol-val">{{ channel.volume }}</div>

    <!-- Mute / Solo -->
    <div class="mc__btns">
      <button
        class="mc__btn"
        :class="{ 'mc__btn--mute': channel.muted }"
        @click="store.toggleMute(index)"
        title="Mute"
      >M</button>
      <button
        class="mc__btn"
        :class="{ 'mc__btn--solo': channel.soloed }"
        @click="store.toggleSolo(index)"
        title="Solo"
      >S</button>
    </div>
  </div>
</template>

<style scoped>
.mc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--track-color);
  border-radius: var(--radius-md);
  width: 80px;
  flex-shrink: 0;
  transition: opacity var(--transition-fast), border-color var(--transition-fast);
}

.mc--muted { opacity: 0.35; }
.mc--soloed { border-color: var(--color-warning); }

.mc__name {
  font-size: 0.68rem;
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.mc__sends {
  display: flex;
  gap: 4px;
}

/* Vertical fader with custom track */
.mc__fader-wrap {
  position: relative;
  height: 130px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc__fader-track {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 100%;
  background: var(--color-surface-2);
  border-radius: 2px;
  overflow: hidden;
  pointer-events: none;
}

.mc__fader-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: 2px;
  transition: height 0.05s linear;
}

.mc__fader {
  position: relative;
  writing-mode: vertical-lr;
  direction: rtl;
  appearance: slider-vertical;
  -webkit-appearance: slider-vertical;
  width: 24px;
  height: 120px;
  cursor: pointer;
  accent-color: var(--track-color);
  background: transparent;
  z-index: 1;
}

.mc__vol-val {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-text-muted);
}

.mc__btns { display: flex; gap: 2px; }

.mc__btn {
  width: 24px;
  height: 22px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.62rem;
  font-weight: 700;
  transition: all var(--transition-fast);
  padding: 0;
}

.mc__btn--mute {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: #000;
}

.mc__btn--solo {
  background: var(--color-info);
  border-color: var(--color-info);
  color: #fff;
}
</style>
