import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/global.css'
import App from './App.vue'
import router from './router' // 新增

const app = createApp(App)

app.use(createPinia())
app.use(router) // 新增

app.mount('#app')