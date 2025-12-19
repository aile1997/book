<script setup lang="ts">
interface Props {
  title: string
  status: string
  subtitle: string
  imageUrl: string
  imageStyle?: string
  iconSvg?: string
  onClick?: () => void
}

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
    <div class="p-[15px]">
      <div class="text-sm font-medium text-gray-dark mb-[4px] leading-[100%] tracking-[-0.14px]">
        {{ status }}
      </div>
      <div class="text-xl font-medium text-gray-dark mb-[15px] leading-[100%] tracking-[-0.2px]">
        {{ title }}
      </div>
      <div class="text-xs font-medium text-gray leading-[100%] tracking-[-0.12px]">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>
