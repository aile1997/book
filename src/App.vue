<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import ToastContainer from './components/ToastContainer.vue'
import LoadingScreen from './components/LoadingScreen.vue'

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
  <LoadingScreen v-if="isLoading" />

  <div id="app" v-else-if="!authError">
    <router-view />
    <ToastContainer />
  </div>

  <div v-else class="p-10 text-center text-red-500">
    {{ authError }}
  </div>
</template>
