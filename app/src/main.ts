import './assets/main.css'

import { Amplify } from 'aws-amplify'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import authConfig from '@/configs/auth-config'
import { mumbleApi } from '@/lib/mumble-api'

Amplify.configure({
  Auth: authConfig,
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.provide('mumbleApi', mumbleApi)

app.mount('#app')
