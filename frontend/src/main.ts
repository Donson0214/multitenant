import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { startTokenListener } from './services/auth.api'
import { registerGuards } from './router/guards'

const pinia = createPinia()
startTokenListener()
registerGuards(router, pinia)

createApp(App).use(pinia).use(router).mount('#app')
