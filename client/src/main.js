import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/main.css'

// Restore saved theme before first render
const savedTheme = localStorage.getItem('theme')
if (savedTheme) document.documentElement.dataset.theme = savedTheme

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
