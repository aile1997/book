<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'
import FeatureCard from '../components/FeatureCard.vue'

const router = useRouter()

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
    imageUrl: 'https://api.builder.io/api/v1/image/assets/TEMP/f856a51230ac21d679be7c1d9d7019f741a0292f?width=800',
    imageStyle: 'left: -33px; top: 0',
    iconSvg: `<svg class="w-[17px] h-[20px]" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.84039 3.58013C3.00599 2.76242 3.00599 1.43101 3.84039 0.613288C4.6748 -0.204429 6.03338 -0.204429 6.86778 0.613288C7.70218 1.43101 7.70218 2.76242 6.86778 3.58013C6.02268 4.40833 4.6748 4.40833 3.84039 3.58013ZM2.13949 14.6822V6.29537C2.13949 5.71878 1.65811 5.24702 1.06975 5.24702C0.481387 5.24702 -2.50722e-08 5.71878 0 6.29537V14.6822C0 17.5757 2.39623 19.924 5.34874 19.924H10.6975C11.2858 19.924 11.7672 19.4522 11.7672 18.8756C11.7672 18.299 11.2858 17.8273 10.6975 17.8273H5.34874C3.57296 17.8273 2.13949 16.4225 2.13949 14.6822ZM16.3457 18.1942L12.3128 14.2419C11.917 13.854 11.3714 13.6339 10.8045 13.6339H8.02311V9.77591C9.18913 10.709 10.8686 11.5581 12.516 11.8936C13.2328 12.0404 13.9067 11.5162 13.9067 10.8033C13.9067 10.2477 13.4895 9.79688 12.9226 9.70253C11.4035 9.45092 9.84168 8.64369 8.911 7.63727L7.41335 6.01232C7.2101 5.79216 6.95336 5.61394 6.67522 5.48814C6.365 5.34137 6.01198 5.24702 5.64827 5.24702H5.61617C4.28969 5.24702 3.20924 6.30586 3.20924 7.60582V13.6339C3.20924 15.3741 4.6427 16.7789 6.41849 16.7789H11.8421L14.816 19.6934C15.2332 20.1022 15.9285 20.1022 16.3457 19.6934C16.7736 19.2845 16.7736 18.6136 16.3457 18.1942Z" fill="white"/>
    </svg>`,
    route: '/booking',
    enabled: true,
  },
  {
    id: 'coin-store',
    title: 'Coin Store',
    status: 'New arrival',
    subtitle: 'Coming soon',
    imageUrl: 'https://api.builder.io/api/v1/image/assets/TEMP/484b36a66a7ab02e58b25e1672b3fba9efe881ce?width=1496',
    imageStyle: 'left: -103px; top: -99px; transform: scale(0.5);',
    iconSvg: `<svg class="w-[18px] h-[18px]" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0)">
        <path d="M1.75 10.75H3.5V2C3.5 1.8851 3.5226 1.7713 3.5666 1.6652C3.6106 1.559 3.675 1.4625 3.7563 1.3813C3.8375 1.3 3.934 1.2356 4.0402 1.1916C4.1463 1.1476 4.2601 1.125 4.375 1.125H14.875V-0.625C14.875 -0.8571 14.7828 -1.0796 14.6187 -1.2437C14.4546 -1.4078 14.2321 -1.5 14 -1.5H11.3304C11.1099 -3.4635 9.4587 -5 7.4375 -5C5.4162 -5 3.7651 -3.4635 3.5446 -1.5H0.875C0.6429 -1.5 0.4204 -1.4078 0.2563 -1.2437C0.0922 -1.0796 0 -0.8571 0 -0.625V9C0 9.2298 0.0453 9.4574 0.1332 9.6697C0.2212 9.882 0.3501 10.0749 0.5126 10.2374C0.6751 10.3999 0.868 10.5288 1.0803 10.6168C1.2926 10.7047 1.5202 10.75 1.75 10.75ZM7.4375 -3.25C8.4936 -3.25 9.3782 -2.4975 9.5812 -1.5H5.2937C5.4967 -2.4975 6.3814 -3.25 7.4375 -3.25Z" fill="white" transform="translate(1.75, 10.75)"/>
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="200" height="169" fill="white"/>
        </clipPath>
      </defs>
    </svg>`,
    route: '/coin-store',
    enabled: false,
  },
])

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
  <div class="relative min-h-screen bg-white overflow-hidden">
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
          <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15.7322 16.4564C14.5895 16.794 13.239 16.9498 11.6547 16.9498H3.86333C2.27896 16.9498 0.928542 16.794 -0.214167 16.4564C0.0715417 13.0801 3.53854 10.418 7.759 10.418C11.9794 10.418 15.4465 13.0801 15.7322 16.4564Z"
              fill="white"
              stroke="white"
              stroke-width="1.5"
            />
            <path
              d="M12.4079 2.12012C12.4079 4.69137 10.3302 6.78195 7.759 6.78195C5.18775 6.78195 3.11008 4.69137 3.11008 2.12012C3.11008 -0.451125 5.18775 -2.54879 7.759 -2.54879C10.3302 -2.54879 12.4079 -0.451125 12.4079 2.12012Z"
              fill="white"
              stroke="white"
              stroke-width="1.5"
            />
          </svg>
        </button>
      </div>

      <!-- 问候语 -->
      <div class="px-[33px] mb-12">
        <div class="text-gray-dark text-base font-medium mb-2 leading-[100%] tracking-[-0.16px]">
          Morning,
        </div>
        <h1 class="text-gray-dark text-[32px] font-semibold leading-[100%]">
          Alex Zhou
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
