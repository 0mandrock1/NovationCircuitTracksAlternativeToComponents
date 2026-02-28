<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader      from '@/components/layout/AppHeader.vue'
import TabNav         from '@/components/layout/TabNav.vue'
import StatusBar      from '@/components/layout/StatusBar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast }     from '@/composables/useToast'

const router = useRouter()
const { toast } = useToast()

// Listen for device connect/disconnect events
const { on } = useWebSocket()
on('device:status', (msg) => {
  if (!msg.connected) toast('Device disconnected', { type: 'warning' })
  else                toast(`Connected: ${msg.port}`, { type: 'success' })
})

// ── Keyboard shortcuts (numbers 1–7 → tabs) ──────────────────────────────────
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
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  const route = TAB_KEYS[e.key]
  if (route && !e.ctrlKey && !e.metaKey && !e.altKey) {
    router.push(route)
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="app">
    <AppHeader />
    <TabNav />
    <main class="app-content">
      <RouterView />
    </main>
    <StatusBar />
    <ToastContainer />
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
</style>
