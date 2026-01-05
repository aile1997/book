<template>
  <button
    @click="handleClick"
    class="fixed right-[33px] top-[22px] w-[25px] h-[25px] rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity z-[9999] shadow-lg"
  >
    <img src="@/assets/images/home/Group 1.png" alt="Account" />
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const handleClick = () => {
  router.push('/account')
}
</script>
