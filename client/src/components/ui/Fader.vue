<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 100 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 127 },
  height: { type: Number, default: 120 }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <input
    type="range"
    class="fader"
    orient="vertical"
    :min="min"
    :max="max"
    :value="modelValue"
    :style="{ height: height + 'px' }"
    @input="emit('update:modelValue', Number($event.target.value))"
  />
</template>

<style scoped>
.fader {
  writing-mode: vertical-lr;
  direction: rtl;
  appearance: slider-vertical;
  width: 28px;
  cursor: pointer;
  accent-color: var(--color-accent);
}
</style>
