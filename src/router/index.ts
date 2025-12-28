import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import '../assets/styles/nprogress-custom.css'
import HomePage from '../pages/HomePage.vue'
import BookingPage from '../pages/BookingPage.vue'
import AccountPage from '../pages/AccountPage.vue'
import CoinStorePage from '../pages/CoinStorePage.vue'
import AdminPage from '../pages/AdminPage.vue'
import PresentationPage from '../pages/PresentationPage.vue'

// 配置 NProgress
NProgress.configure({
  showSpinner: false, // 不显示右上角的加载图标
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3, // 初始化时的最小百分比
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/booking',
      name: 'booking',
      meta: { manualNProgress: true },
      component: BookingPage,
    },
    {
      path: '/account',
      name: 'account',
      meta: { manualNProgress: true },
      component: AccountPage,
    },
    {
      path: '/coin-store',
      name: 'coin-store',
      component: CoinStorePage,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage,
    },
    {
      path: '/presentation',
      name: 'presentation',
      component: PresentationPage,
    },
  ],
})

// 路由全局前置守卫
router.beforeEach((to, from, next) => {
  // 开始加载条
  NProgress.start()
  next()
})

// 路由全局后置守卫
router.afterEach((to) => {
  // 如果页面 meta 明确标注了需要“手动控制结束”，则路由守卫不关闭进度条
  if (!to.meta.manualNProgress) {
    NProgress.done()
  }
})

export default router
