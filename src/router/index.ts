import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import BookingPage from '../pages/BookingPage.vue'
import AccountPage from '../pages/AccountPage.vue'
import CoinStorePage from '../pages/CoinStorePage.vue'
import AdminPage from '../pages/AdminPage.vue'

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
      component: BookingPage,
    },
    {
      path: '/account',
      name: 'account',
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
  ],
})

export default router
