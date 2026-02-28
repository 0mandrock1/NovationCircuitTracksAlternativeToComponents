<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div" class="toast-stack">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type}`"
      >
        <span class="toast__text">{{ t.text }}</span>
        <button class="toast__close" @click="dismiss(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 40px;
  right: var(--spacing-md);
  z-index: 9999;
  pointer-events: none;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: flex-end;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  max-width: 340px;
  pointer-events: all;
}

.toast--info    { background: var(--color-surface-3); border: 1px solid var(--color-border); color: var(--color-text); }
.toast--success { background: #1a3028; border: 1px solid var(--color-success); color: var(--color-success); }
.toast--warning { background: #32280a; border: 1px solid var(--color-warning); color: var(--color-warning); }
.toast--error   { background: #2a1414; border: 1px solid var(--color-error);   color: var(--color-error);   }

.toast__text { flex: 1; }

.toast__close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.7rem;
  opacity: 0.7;
  padding: 0;
  flex-shrink: 0;
  line-height: 1;
}
.toast__close:hover { opacity: 1; }

/* slide-up enter, fade-out leave */
.toast-enter-active { transition: all 0.2s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(16px); }
.toast-leave-to     { opacity: 0; }
</style>
