<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'
import FeatureCard from '../components/FeatureCard.vue'
import { useToast } from '../composables/useToast'

import Photo from '@/assets/images/home/Photo.png'
import Group54 from '@/assets/images/home/Group 54.svg'

import Escultures from '@/assets/images/home/Escultures.png'
import Group55 from '@/assets/images/home/Group 55.svg'

import { useAuth } from '../composables/useAuth'
import { useBooking } from '../composables/useBooking'
import { useInvitations } from '../composables/useInvitations'

const router = useRouter()
const { info } = useToast()
const { user, isAdmin } = useAuth()
const { bookings, loadBookings } = useBooking()
const { upcomingInvitations, startPolling, stopPolling } = useInvitations()

const userData = computed(() => {
  const hour = new Date().getHours()

  // 1. 极简时间判断：使用三元表达式或映射
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

  // 2. 直接返回：通过可选链确保响应式追踪
  // 这里的 user.value 只要在 App.vue 接口返回后更新，这里会自动重新计算
  return {
    name: user.value?.fullName || user.value?.name || '...',
    greeting,
  }
})

// 功能卡片数据（可以从API获取）
interface FeatureCardData {
  id: string
  title: string
  status: string
  subtitle: string
  imageUrl: string
  imageStyle: string
  iconSvg: string
  route: string
  enabled: boolean
}

// 计算属性：根据预订和邀请状态动态生成卡片数据
const featureCards = computed<FeatureCardData[]>(() => {
  // 计算 Booking Seats 卡片的状态和副标题
  let bookingStatus = 'Open now'
  let bookingSubtitle = 'No bookings'

  // 检查是否有待处理的邀请
  const pendingInvitations = upcomingInvitations.value.filter((inv) => inv.status === 'PENDING')
  if (pendingInvitations.length > 0) {
    bookingStatus = 'New Invitation'
    bookingSubtitle = `${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} pending`
  } else if (bookings.value.length > 0) {
    // 如果有预订，显示最近的预订信息
    const latestBooking = bookings.value[0]
    bookingStatus = 'Booked'
    bookingSubtitle = `${latestBooking.seatNumber} - ${latestBooking.bookingDate}`
  }

  return [
    {
      id: 'booking',
      title: 'Booking Seats',
      status: bookingStatus,
      subtitle: bookingSubtitle,
      imageUrl: Photo,
      imageStyle: '',
      iconSvg: Group54,
      route: '/booking',
      enabled: true,
    },
    {
      id: 'coin-store',
      title: 'Coin Store',
      status: 'New arrival',
      subtitle: 'Coming soon',
      imageUrl: Escultures,
      imageStyle: '',
      iconSvg: Group55,
      route: '/coin-store',
      enabled: isAdmin.value,
    },
    {
      id: 'admin',
      title: 'Admin Page',
      status: 'Coming soon',
      subtitle: 'Coming soon',
      imageUrl: Escultures,
      imageStyle: '',
      route: '/admin',
      enabled: true,
      isAdmin: isAdmin.value ? true : false,
    },
  ].filter((card) => {
    // 根据isAdmin属性来控制是否显示卡片
    return card.isAdmin === undefined || card.isAdmin === true
  })
})

// ========== 事件处理层 ==========

// 点击卡片处理
const handleCardClick = (card: FeatureCardData) => {
  if (card.enabled) {
    router.push(card.route)
  } else {
    info('Coming soon!')
  }
}

// 导航到账户页
const navigateToAccount = () => {
  router.push('/account')
}

// 导航到展示页面
const navigateToPresentation = () => {
  router.push('/presentation')
}

// 组件加载时获取预订和邀请数据
onMounted(async () => {
  await loadBookings()
  startPolling() // 开始轮询邀请列表
})

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling()
})

// 路由切换时停止轮询，避免与其他页面的请求冲突
onBeforeRouteLeave(() => {
  stopPolling()
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 背景图 -->
    <div class="absolute inset-0 w-full h-full">
      <img src="@/assets/images/home/opacity.png" alt="" class="w-full h-full object-cover" />
    </div>

    <!-- 主要内容 -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <!-- 顶部导航 -->
      <div class="flex items-start justify-between px-[33px] pt-[65px] mb-[90px]">
        <div class="flex items-center gap-3">
          <RockBundLogo color="#292929" />
          <button
            v-if="isAdmin"
            @click="navigateToPresentation"
            class="px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-lg border border-success/20 hover:bg-success/20 transition-all"
          >
            项目展示
          </button>
        </div>

        <button
          @click="navigateToAccount"
          class="w-[54px] h-[54px] rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <img src="@/assets/images/home/Group 1.png" alt="" />
        </button>
      </div>

      <!-- 问候语 -->
      <div class="px-[33px] mb-12">
        <div class="text-gray-dark text-base font-medium mb-2 leading-[100%] tracking-[-0.16px]">
          {{ userData.greeting }},
        </div>
        <h1 class="text-gray-dark text-[32px] font-semibold leading-[100%]">
          {{ userData.name }}
        </h1>
      </div>

      <!-- 功能卡片列表 -->
      <div class="px-[33px]">
        <div class="flex gap-3 overflow-x-auto pb-4 -mx-[33px] px-[33px]">
          <FeatureCard
            v-for="card in featureCards"
            :key="card.id"
            :title="card.title"
            :status="card.status"
            :subtitle="card.subtitle"
            :image-url="card.imageUrl"
            :image-style="card.imageStyle"
            :icon-svg="card.iconSvg"
            @click="handleCardClick(card)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
