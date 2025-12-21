<script setup lang="ts">
import { onMounted } from 'vue'
import { feishuLogin } from '@/utils/auth'

onMounted(async () => {
  try {
    const user = await feishuLogin()
    console.log('登录成功，用户信息：', user)
    // 这里可以更新你全局的 store，比如 userStore.setUser(user)
  } catch (err) {
    if (err === 'NOT_IN_LARK') {
      // 可以在本地开发环境下模拟一个登录态
      console.log('开发环境：进入调试模式')
    }
  }
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style scoped></style>
