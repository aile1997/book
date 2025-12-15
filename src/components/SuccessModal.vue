<script setup lang="ts">
interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'back'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 关闭模态框并返回
const close = () => {
  emit('update:visible', false)
  emit('back')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        @click.self="close"
      >
        <!-- 成功卡片 -->
        <div class="w-full max-w-md bg-white rounded-3xl p-8 text-center animate-success">
          <!-- 成功图标 -->
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                fill="#38D87B"
              />
              <path
                d="M16 24L22 30L32 18"
                stroke="white"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- 标题 -->
          <h2 class="text-3xl font-bold text-gray-dark mb-3">预订成功！</h2>
          
          <!-- 描述 -->
          <p class="text-base text-gray mb-8">
            您的座位已成功预订。<br />
            我们已向您发送确认邮件。
          </p>

          <!-- 操作按钮 -->
          <div class="space-y-3">
            <button
              @click="close"
              class="w-full px-6 py-4 bg-success text-white text-lg font-semibold rounded-xl hover:bg-success/90 transition-all shadow-lg"
            >
              返回首页
            </button>
            <button
              @click="close"
              class="w-full px-6 py-3 border-2 border-gray-light text-gray-dark text-base font-medium rounded-xl hover:border-gray-dark transition-colors"
            >
              查看我的预订
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 模态框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 成功动画 */
.animate-success {
  animation: success 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes success {
  0% {
    transform: scale(0.3) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
