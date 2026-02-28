<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import TabNav    from '@/components/layout/TabNav.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()
const toast  = ref(null)
let toastTimer = null

function showToast(message, type = 'info') {
  toast.value = { message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

// Listen for device connect/disconnect events
const { on } = useWebSocket()
on('device:status', (msg) => {
  if (!msg.connected) showToast('Device disconnected', 'warning')
  else                showToast(`Connected: ${msg.port}`, 'success')
})

// ── Keyboard shortcuts ──────────────────────────────────────────────────────
const TAB_KEYS = {
  '1': '/patches',
  '2': '/samples',
  '3': '/sequencer',
  '4': '/mixer',
  '5': '/midi',
  '6': '/sessions',
  '7': '/device',
}

function onKeyDown(e) {
  // Skip if focus is in an input/textarea/select
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  const route = TAB_KEYS[e.key]
  if (route && !e.ctrlKey && !e.metaKey && !e.altKey) {
    router.push(route)
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="app">
    <AppHeader />
    <TabNav />
    <main class="app-content">
      <RouterView />
    </main>
    <StatusBar />

    <!-- Toast notifications -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="`toast--${toast.type}`">
        {{ toast.message }}
        <button class="toast__close" @click="toast = null">✕</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

@media (max-width: 768px) {
  .app-content {
    padding: var(--spacing-sm);
  }
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  max-width: 400px;
}

.toast--info    { background: var(--color-surface-3); border: 1px solid var(--color-border); color: var(--color-text); }
.toast--success { background: #1a3028; border: 1px solid var(--color-success); color: var(--color-success); }
.toast--warning { background: #32280a; border: 1px solid var(--color-warning); color: var(--color-warning); }
.toast--error   { background: #2a1414; border: 1px solid var(--color-error);   color: var(--color-error);   }

.toast__close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.7rem;
  opacity: 0.7;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
}
.toast__close:hover { opacity: 1; }

.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
