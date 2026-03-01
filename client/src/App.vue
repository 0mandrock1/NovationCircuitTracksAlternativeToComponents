<script setup>
import { ref } from 'vue'
import AppHeader      from '@/components/layout/AppHeader.vue'
import TabNav         from '@/components/layout/TabNav.vue'
import StatusBar      from '@/components/layout/StatusBar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ShortcutsModal from '@/components/ui/ShortcutsModal.vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast }     from '@/composables/useToast'
import { useKeyboard }  from '@/composables/useKeyboard'

const { toast } = useToast()

// Listen for device connect/disconnect events
const { on } = useWebSocket()
on('device:status', (msg) => {
  if (!msg.connected) toast('Device disconnected', { type: 'warning' })
  else                toast(`Connected: ${msg.port}`, { type: 'success' })
})

// Shortcuts modal
const showShortcuts = ref(false)
useKeyboard(() => { showShortcuts.value = !showShortcuts.value })
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
    <ShortcutsModal :show="showShortcuts" @close="showShortcuts = false" />
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
