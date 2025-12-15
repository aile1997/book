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

// 返回
const goBack = () => {
  emit('back')
  emit('update:visible', false)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-end justify-center"
    @click.self="goBack"
  >
    <!-- 绿色成功模态框 -->
    <div class="w-full rounded-t-[45px] bg-success px-8 pb-8 pt-12 animate-slide-up">
      <h2 class="text-2xl font-semibold text-white text-center mb-12 leading-[100%] tracking-[-0.24px] whitespace-pre-line">
        Successfully
Booked
      </h2>

      <!-- 返回按钮 -->
      <div class="flex justify-center">
        <button
          @click="goBack"
          class="px-12 h-[52px] rounded-lg border-2 border-white text-white text-xl font-medium leading-[100%] tracking-[-0.2px] hover:bg-white/10 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
