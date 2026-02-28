<script setup>
import { useMixerStore } from '@/stores/mixer'
import FxSends from './FxSends.vue'

const props = defineProps({
  channel: { type: Object, required: true },
  index: { type: Number, required: true }
})

const store = useMixerStore()

function panLabel(val) {
  if (val === 0) return 'C'
  return val < 0 ? `L${Math.abs(val)}` : `R${val}`
}
</script>

<template>
  <div class="mixer-channel" :class="{ 'mixer-channel--muted': channel.muted }">
    <div class="mixer-channel__name">{{ channel.name }}</div>
    <div class="mixer-channel__fader-wrap">
      <input
        type="range"
        class="mixer-channel__fader"
        orient="vertical"
        min="0" max="127"
        :value="channel.volume"
        @input="store.setVolume(index, Number($event.target.value))"
      />
    </div>
    <div class="mixer-channel__value">{{ channel.volume }}</div>
    <div class="mixer-channel__pan-wrap">
      <input
        type="range"
        class="mixer-channel__pan"
        min="-63" max="63"
        :value="channel.pan"
        @input="store.setPan(index, Number($event.target.value))"
        title="Pan"
      />
      <span class="mixer-channel__pan-label">{{ panLabel(channel.pan) }}</span>
    </div>
    <div class="mixer-channel__controls">
      <button
        class="mixer-channel__btn"
        :class="{ 'mixer-channel__btn--mute-active': channel.muted }"
        @click="store.toggleMute(index)"
        title="Mute"
      >M</button>
      <button
        class="mixer-channel__btn"
        :class="{ 'mixer-channel__btn--solo-active': channel.soloed }"
        @click="store.toggleSolo(index)"
        title="Solo"
      >S</button>
    </div>
    <FxSends :channel="channel" :index="index" />
  </div>
</template>

<style scoped>
.mixer-channel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 86px;
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
}

.mixer-channel--muted {
  opacity: 0.4;
}

.mixer-channel__name {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.mixer-channel__fader-wrap {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mixer-channel__fader {
  writing-mode: vertical-lr;
  direction: rtl;
  appearance: slider-vertical;
  width: 32px;
  height: 110px;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.mixer-channel__value {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.mixer-channel__pan-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.mixer-channel__pan {
  width: 100%;
  accent-color: var(--color-text-dim);
  cursor: pointer;
}

.mixer-channel__pan-label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-text-muted);
}

.mixer-channel__controls {
  display: flex;
  gap: 3px;
}

.mixer-channel__btn {
  width: 22px;
  height: 22px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.mixer-channel__btn--mute-active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: #000;
}

.mixer-channel__btn--solo-active {
  background: var(--color-info);
  border-color: var(--color-info);
  color: #fff;
}
</style>
