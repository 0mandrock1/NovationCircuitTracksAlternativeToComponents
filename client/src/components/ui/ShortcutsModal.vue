<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

function onKeyDown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="shortcuts-modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <h2 class="shortcuts-modal__title">Keyboard Shortcuts</h2>

        <table class="shortcuts-table">
          <tbody>
            <tr>
              <td><kbd>Space</kbd></td>
              <td>Play / Stop</td>
            </tr>
            <tr>
              <td><kbd>Esc</kbd></td>
              <td>Stop</td>
            </tr>
            <tr>
              <td><kbd>Ctrl Z</kbd></td>
              <td>Undo</td>
            </tr>
            <tr>
              <td><kbd>Ctrl Shift Z</kbd></td>
              <td>Redo</td>
            </tr>
            <tr>
              <td><kbd>Tab</kbd></td>
              <td>Next tab</td>
            </tr>
            <tr>
              <td><kbd>Shift Tab</kbd></td>
              <td>Previous tab</td>
            </tr>
            <tr>
              <td><kbd>1 – 7</kbd></td>
              <td>Jump to tab</td>
            </tr>
            <tr>
              <td><kbd>?</kbd></td>
              <td>Show / Hide shortcuts</td>
            </tr>
          </tbody>
        </table>

        <button class="shortcuts-modal__close" @click="emit('close')" title="Close">✕</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.shortcuts-modal {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.shortcuts-modal__title {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.shortcuts-table {
  width: 100%;
  border-collapse: collapse;
}

.shortcuts-table td {
  padding: 5px var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.shortcuts-table tr:last-child td {
  border-bottom: none;
}

.shortcuts-table td:first-child {
  white-space: nowrap;
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.shortcuts-modal__close {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.shortcuts-modal__close:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}
</style>
