<script setup>
</script>

<template>
  <div class="midi-ref">
    <iframe
      class="midi-ref__frame"
      src="/circuit-tracks-midi-cheatsheet.html"
      title="Circuit Tracks MIDI Cheat Sheet"
    />
  </div>
</template>

<style scoped>
.midi-ref {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: calc(-1 * var(--spacing-md));
}

.midi-ref__frame {
  flex: 1;
  width: 100%;
  border: none;
  background: #0d0d0f;
}
</style>
