<script setup>
import { useMixerStore } from '@/stores/mixer'
import MixerChannel from '@/components/mixer/MixerChannel.vue'

const store = useMixerStore()
</script>

<template>
  <div class="mixer-view">
    <h2>Mixer</h2>
    <div class="mixer-view__channels">
      <MixerChannel
        v-for="(channel, index) in store.channels"
        :key="index"
        :channel="channel"
        :index="index"
      />
    </div>
  </div>
</template>

<style scoped>
.mixer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mixer-view__channels {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
}
</style>
