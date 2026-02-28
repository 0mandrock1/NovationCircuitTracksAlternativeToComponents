<script setup>
import { useMixerStore } from '@/stores/mixer'

const props = defineProps({
  channel: { type: Object, required: true },
  index: { type: Number, required: true }
})

const store = useMixerStore()
</script>

<template>
  <div class="fx-sends">
    <div class="fx-sends__row">
      <span class="fx-sends__label">Rev</span>
      <input
        type="range"
        class="fx-sends__slider"
        min="0" max="127"
        :value="channel.reverbSend"
        @input="store.setReverbSend(props.index, Number($event.target.value))"
        title="Reverb Send"
      />
      <span class="fx-sends__val">{{ channel.reverbSend }}</span>
    </div>
    <div class="fx-sends__row">
      <span class="fx-sends__label">Dly</span>
      <input
        type="range"
        class="fx-sends__slider"
        min="0" max="127"
        :value="channel.delaySend"
        @input="store.setDelaySend(props.index, Number($event.target.value))"
        title="Delay Send"
      />
      <span class="fx-sends__val">{{ channel.delaySend }}</span>
    </div>
  </div>
</template>

<style scoped>
.fx-sends {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fx-sends__row {
  display: flex;
  align-items: center;
  gap: 3px;
}

.fx-sends__label {
  font-size: 0.62rem;
  color: var(--color-text-muted);
  width: 20px;
  flex-shrink: 0;
  text-align: center;
}

.fx-sends__slider {
  flex: 1;
  height: 14px;
  accent-color: var(--color-info);
  cursor: pointer;
  min-width: 0;
}

.fx-sends__val {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-text-muted);
  width: 20px;
  text-align: right;
  flex-shrink: 0;
}
</style>
