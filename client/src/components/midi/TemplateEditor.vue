<script setup>
import { ref } from 'vue'
import { useMidiStore } from '@/stores/midi'

const store = useMidiStore()
const activeTemplate = ref(0)
</script>

<template>
  <div class="template-editor">
    <h3 class="template-editor__title">MIDI Templates</h3>
    <div class="template-editor__tabs">
      <button
        v-for="(tmpl, i) in store.templates"
        :key="i"
        class="template-editor__tab"
        :class="{ 'template-editor__tab--active': activeTemplate === i }"
        @click="activeTemplate = i"
      >
        {{ i + 1 }}
      </button>
    </div>
    <div class="template-editor__table">
      <div class="template-editor__row template-editor__row--header">
        <span>Macro</span>
        <span>CC Number</span>
      </div>
      <div
        v-for="(cc, macroIndex) in store.templates[activeTemplate].macroCC"
        :key="macroIndex"
        class="template-editor__row"
      >
        <span class="template-editor__macro-label">Macro {{ macroIndex + 1 }}</span>
        <input
          type="number"
          min="0" max="127"
          :value="cc"
          class="template-editor__cc-input"
          @change="store.setMacroCC(activeTemplate, macroIndex, Number($event.target.value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-editor {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.template-editor__title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.template-editor__tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.template-editor__tab {
  width: 32px;
  height: 28px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--transition-fast);
}

.template-editor__tab--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.template-editor__table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-editor__row {
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.template-editor__row--header {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: var(--spacing-xs);
}

.template-editor__macro-label {
  font-size: 0.85rem;
}

.template-editor__cc-input {
  width: 80px;
  text-align: center;
  font-family: var(--font-mono);
}
</style>
