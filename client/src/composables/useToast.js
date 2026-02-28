import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 0

export function useToast() {
  function toast(text, { type = 'info', duration = 3000 } = {}) {
    // Keep at most 4 toasts — drop the oldest if needed
    if (toasts.length >= 4) toasts.shift()
    const id = nextId++
    toasts.push({ id, text, type })
    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id)
      if (idx !== -1) toasts.splice(idx, 1)
    }, duration)
  }

  function dismiss(id) {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  return { toast, toasts, dismiss }
}
