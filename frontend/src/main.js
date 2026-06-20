import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  create,
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  NDateProvider,
  darkTheme,
  zhCN,
  dateZhCN,
} from 'naive-ui'
import App from './App.vue'
import router from './router'
import './styles/global.scss'

const naive = create({
  components: [
    NConfigProvider,
    NMessageProvider,
    NDialogProvider,
    NNotificationProvider,
    NLoadingBarProvider,
    NDateProvider,
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(naive)
app.mount('#app')

app.config.globalProperties.$zhCN = zhCN
app.config.globalProperties.$dateZhCN = dateZhCN
