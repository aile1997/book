<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getLarkCode, loginWithBackend } from './utils/auth'

const isLoggingIn = ref(true)
const loginError = ref('')

onMounted(async () => {
  try {
    // 1. 从飞书获取 code
    const code = await getLarkCode()

    // 2. 将 code 传给后端换取用户信息和 Token
    const result = await loginWithBackend(code)

    console.log(result)

    // 3. 存储登录态
    localStorage.setItem('token', result.token)
    console.log('登录成功，欢迎:', result.user.name)

    isLoggingIn.value = false
  } catch (err: any) {
    console.error('免登流程异常:', err)
    loginError.value = err.message || '登录失败，请在飞书内打开'
    // 开发环境下可以设置默认登录，方便调试
    if (import.meta.env.DEV) {
      isLoggingIn.value = false
    }
  }
})
</script>
<template>
  <div v-if="isLoggingIn" class="flex items-center justify-center h-screen">
    <div class="text-gray-500">正在进入飞书办公系统...</div>
  </div>
  <div id="app" v-else-if="!loginError"><router-view /></div>
  <div v-else class="p-10 text-center text-red-500">
    {{ loginError }}
  </div>
</template>

<style scoped></style>
