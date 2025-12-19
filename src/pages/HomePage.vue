<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'
import FeatureCard from '../components/FeatureCard.vue'

import Photo from '@/assets/images/home/Photo.png'
import Group54 from '@/assets/images/home/Group 54.svg'

import Escultures from '@/assets/images/home/Escultures.png'
import Group55 from '@/assets/images/home/Group 55.svg'

const router = useRouter()

// ========== 数据层 ==========

// 用户数据（可以从API获取）
interface UserData {
  name: string
  greeting: string
}

const userData = ref<UserData>({
  name: 'Alex Zhou',
  greeting: 'Morning',
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

const featureCards = ref<FeatureCardData[]>([
  {
    id: 'booking',
    title: 'Booking Seats',
    status: 'Open now',
    subtitle: 'Tomorrow : 10 seats left',
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
    enabled: false,
  },
])

// ========== 事件处理层 ==========

// 点击卡片处理
const handleCardClick = (card: FeatureCardData) => {
  if (card.enabled) {
    router.push(card.route)
  } else {
    alert('Coming soon!')
  }
}

// 导航到账户页
const navigateToAccount = () => {
  router.push('/account')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 背景图 -->
    <div class="absolute inset-0 w-full h-full">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/8bd54818f10b6c6ac11ede7b04b6f0c919dc42bc?width=750"
        alt=""
        class="w-full h-full object-cover"
      />
    </div>

    <!-- 主要内容 -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <!-- 顶部导航 -->
      <div class="flex items-start justify-between px-[33px] pt-[65px] mb-[90px]">
        <RockBundLogo color="#292929" />

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
