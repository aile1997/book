<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import ToastMessage from './ToastMessage.vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <ToastMessage
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="0"
      :visible="toast.visible"
      @update:visible="(val) => !val && removeToast(toast.id)"
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 9999;
}

.toast-container > * {
  pointer-events: auto;
}
</style>
