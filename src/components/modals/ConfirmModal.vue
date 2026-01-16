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
  cancelText: 'Cancel',
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
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
        @click.self="handleCancel"
      >
        <div
          class="w-full max-w-[320px] bg-[#2C2C2C] rounded-[24px] p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center"
        >
          <h3 class="text-white text-xl font-bold mb-3">{{ title }}</h3>
          <p class="text-white/70 text-sm mb-8 leading-relaxed whitespace-pre-line">
            {{ message }}
          </p>

          <div class="flex flex-col gap-3 w-full">
            <button
              @click="handleConfirm"
              class="w-full py-3.5 bg-white text-[#2C2C2C] text-base font-bold rounded-xl active:scale-95 transition-all"
            >
              {{ confirmText }}
            </button>

            <button
              @click="handleCancel"
              class="w-full py-3.5 bg-transparent border border-white/20 text-white/80 text-base font-medium rounded-xl hover:bg-white/5 active:scale-95 transition-all"
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

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
