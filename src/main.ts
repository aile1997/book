import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/base.css'
import { clickOutside } from './directives/clickOutside'

const app = createApp(App)
app.use(router)

// 注册全局指令
app.directive('click-outside', clickOutside)

app.mount('#app')
