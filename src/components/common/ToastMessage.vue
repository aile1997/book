<script setup lang="ts">
import { watch } from 'vue'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  visible: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000,
})

const emit = defineEmits<Emits>()

// 自动关闭
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.duration > 0) {
      setTimeout(() => {
        emit('update:visible', false)
      }, props.duration)
    }
  },
)

// 手动关闭
const close = () => {
  emit('update:visible', false)
}

// 根据类型返回对应的颜色类
const typeClasses = {
  success: 'bg-success',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  confirm: 'bg-gray-dark shadow-2xl border border-white/10',
}

// 按钮处理
const handleConfirm = () => props.onConfirm?.()
const handleCancel = () => props.onCancel?.()

// 根据类型返回对应的图标
const getIcon = () => {
  switch (props.type) {
    case 'success':
      return `<path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    case 'error':
      return `<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    case 'warning':
      return `<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    case 'info':
      return `<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="visible"
        class="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] px-4 w-full max-w-md"
      >
        <!-- Toast 内容 -->
        <div :class="[typeClasses[type], 'rounded-xl px-6 py-4 shadow-2xl']">
          <div class="flex items-center justify-between gap-4">
            <!-- 左侧：图标和文字 -->
            <div class="flex items-center gap-3 flex-1">
              <!-- 图标 -->
              <div class="w-6 h-6 flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  v-html="getIcon()"
                />
              </div>

              <!-- 消息文本 -->
              <p class="text-white text-sm font-medium leading-snug">
                {{ message }}
              </p>
            </div>

            <!-- 右侧：关闭按钮 -->
            <button
              @click="close"
              class="w-6 h-6 flex-shrink-0 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <div v-if="type === 'confirm'" class="flex justify-end gap-3">
            <button
              @click="handleCancel"
              class="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              class="px-5 py-2 rounded-lg bg-success text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Toast 动画 */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-leave-active {
  transition: all 0.2s ease-out;
}

.toast-enter-from {
  transform: translate(-50%, -20px);
  opacity: 0;
}

.toast-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}
</style>
