<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import TabNav from '@/components/layout/TabNav.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
</script>

<template>
  <div class="app">
    <AppHeader />
    <TabNav />
    <main class="app-content">
      <RouterView />
    </main>
    <StatusBar />
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
</style>
