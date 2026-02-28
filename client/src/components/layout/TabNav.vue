<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { label: 'Patches', path: '/patches' },
  { label: 'Samples', path: '/samples' },
  { label: 'Sequencer', path: '/sequencer' },
  { label: 'Mixer', path: '/mixer' },
  { label: 'MIDI', path: '/midi' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Device', path: '/device' }
]
</script>

<template>
  <nav class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="tab-nav__tab"
      :class="{ 'tab-nav__tab--active': route.path === tab.path }"
      @click="router.push(tab.path)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<style scoped>
.tab-nav {
  display: flex;
  gap: 2px;
  padding: 0 var(--spacing-md);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.tab-nav::-webkit-scrollbar { display: none; }

@media (max-width: 768px) {
  .tab-nav {
    padding: 0 var(--spacing-xs);
    gap: 0;
  }
  .tab-nav__tab {
    padding: var(--spacing-sm) var(--spacing-sm);
    font-size: 0.78rem;
  }
}

.tab-nav__tab {
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.tab-nav__tab:hover {
  color: var(--color-text);
}

.tab-nav__tab--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}
</style>
