<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth } from './composables/useAuth'
import { useSeats } from './composables/useSeats'
import { useInvitations } from './composables/useInvitations'
import { cache, CacheKeys, CacheTTL } from './utils/cache'
import ToastContainer from './components/ToastContainer.vue'
import LoadingScreen from './components/LoadingScreen.vue'

const { isLoading, authError, signInWithFeishu, checkAuthStatus, user } = useAuth()
const { loadAreas, loadSeatMap } = useSeats()
const { upcomingInvitations, loadInvitations } = useInvitations()

const isPreloading = ref(true)

// 预加载函数
async function preloadData() {
  try {
    // 并行预加载邀请状态、区域和座位数据
    await Promise.all([
      // 预加载邀请状态
      loadInvitations(),
      
      // 预加载区域数据（使用缓存，30分钟有效）
      cache.getOrFetch(
        CacheKeys.SEAT_AREAS,
        () => loadAreas(),
        CacheTTL.LONG
      ),
      
      // 预加载座位图数据（使用缓存，30分钟有效）
      cache.getOrFetch(
        CacheKeys.SEAT_MAP(),
        () => loadSeatMap(),
        CacheTTL.LONG
      ),
    ])
    
    console.log('预加载完成')
  } catch (error) {
    console.error('预加载失败:', error)
  } finally {
    isPreloading.value = false
  }
}

onMounted(async () => {
  try {
    console.log(localStorage.getItem('authToken'))
    if (localStorage.getItem('authToken')) {
      await checkAuthStatus() // 验证旧token并获取用户信息
    } else {
      await signInWithFeishu() // 走免登流程
    }
    console.log('登录成功，欢迎:', user.value?.fullName)
    
    // 登录成功后开始预加载
    await preloadData()
  } catch (err: any) {
    console.error('免登流程异常:', err)
    isPreloading.value = false
  }
})
</script>

<template>
  <LoadingScreen v-if="isLoading" />

  <!-- 预加载状态 -->
  <div v-else-if="isPreloading" class="flex items-center justify-center h-screen">
    <div class="text-gray-500">加载中...</div>
  </div>

  <!-- 主应用 -->
  <div id="app" v-else-if="!authError">
    <router-view />
    <ToastContainer />
  </div>

  <!-- 错误状态 -->
  <div v-else class="p-10 text-center text-red-500">
    {{ authError }}
  </div>
</template>
