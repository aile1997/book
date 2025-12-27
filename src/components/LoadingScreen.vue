<script setup lang="ts">
import RockBundLogo from './RockBundLogo.vue'
</script>

<template>
  <div class="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
    <div
      class="absolute inset-0 opacity-30"
      style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f5f5f5 100%)"
    />

    <div class="relative z-10 flex flex-col items-center justify-center gap-12">
      <div class="animate-fade-in">
        <RockBundLogo />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="flex gap-1.5">
          <div
            class="w-2 h-2 bg-gray-dark rounded-full animate-bounce"
            style="animation-delay: 0ms"
          ></div>
          <div
            class="w-2 h-2 bg-gray-dark rounded-full animate-bounce"
            style="animation-delay: 150ms"
          ></div>
          <div
            class="w-2 h-2 bg-gray-dark rounded-full animate-bounce"
            style="animation-delay: 300ms"
          ></div>
        </div>

        <p class="text-gray-dark text-sm font-medium tracking-tight opacity-60">
          正在进入飞书办公系统
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gray-dark {
  background-color: var(--gray-dark);
}

.text-gray-dark {
  color: var(--gray-dark);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>
