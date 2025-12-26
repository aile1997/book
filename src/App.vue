<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import ToastContainer from './components/ToastContainer.vue'

const { isLoading, authError, signInWithFeishu, checkAuthStatus, user } = useAuth()

onMounted(async () => {
  try {
    console.log(localStorage.getItem('authToken'))
    if (localStorage.getItem('authToken')) {
      await checkAuthStatus() // 验证旧token并获取用户信息
    } else {
      await signInWithFeishu() // 走免登流程
    }
    console.log('登录成功，欢迎:', user.value?.fullName)
  } catch (err: any) {
    console.error('免登流程异常:', err)
  }
})
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center h-screen">
    <div class="text-gray-500">正在进入飞书办公系统...</div>
  </div>

  <div id="app" v-else-if="!authError">
    <router-view />
    <ToastContainer />
  </div>

  <div v-else class="p-10 text-center text-red-500">
    {{ authError }}
  </div>
</template>
