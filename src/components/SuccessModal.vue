<script setup lang="ts">
interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 关闭提示框
const close = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="visible"
        class="fixed bottom-0 left-0 right-0 z-50 bg-success rounded-t-[32px] px-6 py-8 shadow-2xl"
      >
        <!-- 内容区域 -->
        <div class="flex flex-col items-center text-center">
          <!-- 标题 -->
          <h2 class="text-white text-2xl font-semibold mb-6">
            Successfully<br />Booked
          </h2>

          <!-- Back 按钮 -->
          <button
            @click="close"
            class="w-[200px] px-8 py-3 bg-transparent border-2 border-white text-white text-lg font-medium rounded-xl hover:bg-white/10 transition-all"
          >
            Back
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 底部滑入动画 */
.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
