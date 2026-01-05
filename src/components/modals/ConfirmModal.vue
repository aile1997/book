<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel'
})

const emit = defineEmits<Emits>()

const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:visible', false)
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="w-full max-w-md bg-primary rounded-t-[40px] p-8 pb-12 animate-slide-up flex flex-col items-center text-center"
        >
          <h3 class="text-white text-2xl font-semibold mb-4">{{ title }}</h3>
          <p class="text-white/80 text-base mb-10 px-4 leading-relaxed">
            {{ message }}
          </p>

          <div class="flex flex-col gap-4 w-full px-6">
            <button
              @click="handleConfirm"
              class="w-full py-4 bg-white text-primary text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              {{ confirmText }}
            </button>
            
            <button
              @click="handleCancel"
              class="w-full py-4 bg-transparent border-2 border-white/30 text-white text-lg font-medium rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
            >
              {{ cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-slide-up {
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
