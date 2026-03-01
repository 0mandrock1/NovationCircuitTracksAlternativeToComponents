import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSequencerStore } from '@/stores/sequencer'

const ROUTES = [
  '/patches',
  '/samples',
  '/sequencer',
  '/mixer',
  '/midi',
  '/sessions',
  '/device',
]

const TAB_KEYS = {
  '1': '/patches',
  '2': '/samples',
  '3': '/sequencer',
  '4': '/mixer',
  '5': '/midi',
  '6': '/sessions',
  '7': '/device',
}

export function useKeyboard(onToggleShortcuts) {
  const router = useRouter()

  function onKeyDown(e) {
    // Do not fire when typing in form fields
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    // Number keys 1–7: jump to tab
    const tabRoute = TAB_KEYS[e.key]
    if (tabRoute && !e.ctrlKey && !e.metaKey && !e.altKey) {
      router.push(tabRoute)
      return
    }

    // Space: toggle play/stop
    if (e.code === 'Space') {
      e.preventDefault()
      const sequencer = useSequencerStore()
      const isPlaying = sequencer.transportState === 'playing'
      fetch(isPlaying ? '/api/transport/stop' : '/api/transport/play', { method: 'POST' })
      return
    }

    // Escape: stop
    if (e.key === 'Escape') {
      fetch('/api/transport/stop', { method: 'POST' })
      return
    }

    // Ctrl+Z: undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      return
    }

    // Ctrl+Shift+Z: redo
    if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault()
      return
    }

    // Tab / Shift+Tab: cycle tabs
    if (e.key === 'Tab') {
      e.preventDefault()
      const cur = ROUTES.indexOf(router.currentRoute.value.path)
      if (e.shiftKey) {
        router.push(ROUTES[(cur - 1 + ROUTES.length) % ROUTES.length])
      } else {
        router.push(ROUTES[(cur + 1) % ROUTES.length])
      }
      return
    }

    // ?: toggle shortcuts modal
    if (e.key === '?') {
      onToggleShortcuts?.()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
