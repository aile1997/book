<script setup lang="ts">
import { useRouter } from 'vue-router'
interface Props {
  title: string
  status: string
  subtitle: string
  imageUrl: string
  imageStyle?: string
  iconSvg?: string
  onClick?: () => void
}
const router = useRouter()
const props = withDefaults(defineProps<Props>(), {
  imageStyle: '',
  iconSvg: '',
})
</script>

<template>
  <div
    @click="onClick"
    class="flex-shrink-0 w-[200px] rounded-[10px] shadow-card bg-white cursor-pointer hover:scale-[1.02] transition-transform"
  >
    <!-- 卡片图片区域 -->
    <div class="relative h-[169px] overflow-hidden rounded-t-[10px]">
      <img :src="imageUrl" alt="" :style="imageStyle" />
      <!-- 图标（如果有） -->
      <img v-if="iconSvg" class="absolute left-4 top-[25px]" :src="iconSvg" />
    </div>

    <!-- 卡片内容 -->
    <div class="p-[15px] pb-2.5">
      <div class="text-sm font-medium text-gray-dark mb-[4px] leading-[100%] tracking-[-0.14px]">
        {{ status }}
      </div>

      <div class="text-xl font-medium text-gray-dark mb-[30px] leading-[100%] tracking-[-0.2px]">
        {{ title }}
      </div>

      <div
        v-if="status !== 'New Invitation'"
        class="text-xs font-medium text-gray leading-[100%] tracking-[-0.12px]"
      >
        {{ subtitle }}
      </div>

      <div
        v-else
        class="flex items-center justify-between bg-success px-3 py-1 rounded-[6px] text-white scale-[1.1]"
        @click.stop="router.push('/account')"
      >
        <div class="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            ></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span class="text-sm font-medium">New Invitation</span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  </div>
</template>
