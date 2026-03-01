<script setup>
import { useMixerStore } from '@/stores/mixer'

const props = defineProps({
  channel: { type: Object, required: true },
  index: { type: Number, required: true }
})

const store = useMixerStore()
</script>

<template>
  <div v-if="channel.midiCh !== null" class="fx-sends">
    <div class="fx-sends__row">
      <span class="fx-sends__label" title="Distortion Level (CC 91)">Dist</span>
      <input
        type="range"
        class="fx-sends__slider"
        min="0" max="127"
        :value="channel.distortion"
        @input="store.setDistortion(props.index, Number($event.target.value))"
        title="Distortion (CC 91)"
      />
      <span class="fx-sends__val">{{ channel.distortion }}</span>
    </div>
    <div class="fx-sends__row">
      <span class="fx-sends__label" title="Chorus Level (CC 93)">Cho</span>
      <input
        type="range"
        class="fx-sends__slider fx-sends__slider--chorus"
        min="0" max="127"
        :value="channel.chorus"
        @input="store.setChorus(props.index, Number($event.target.value))"
        title="Chorus (CC 93)"
      />
      <span class="fx-sends__val">{{ channel.chorus }}</span>
    </div>
  </div>
  <div v-else class="fx-sends fx-sends--passthrough">
    <span class="fx-sends__passthrough-label">MIDI out</span>
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
  width: 22px;
  flex-shrink: 0;
  text-align: center;
}

.fx-sends__slider {
  flex: 1;
  height: 14px;
  accent-color: var(--color-warning);
  cursor: pointer;
  min-width: 0;
}

.fx-sends__slider--chorus {
  accent-color: var(--color-info);
}

.fx-sends__val {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-text-muted);
  width: 20px;
  text-align: right;
  flex-shrink: 0;
}

.fx-sends--passthrough {
  align-items: center;
  justify-content: center;
  height: 34px;
}

.fx-sends__passthrough-label {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  opacity: 0.5;
  font-style: italic;
}
</style>
