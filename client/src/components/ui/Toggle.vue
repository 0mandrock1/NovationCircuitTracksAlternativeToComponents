<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="toggle">
    <input
      type="checkbox"
      class="toggle__input"
      :checked="modelValue"
      @change="emit('update:modelValue', $event.target.checked)"
    />
    <span class="toggle__track">
      <span class="toggle__thumb" />
    </span>
    <span v-if="label" class="toggle__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.toggle__input {
  display: none;
}

.toggle__track {
  width: 32px;
  height: 18px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  position: relative;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-text-muted);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.toggle__input:checked + .toggle__track {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.toggle__input:checked + .toggle__track .toggle__thumb {
  transform: translateX(14px);
  background: #fff;
}

.toggle__label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
}
</style>
