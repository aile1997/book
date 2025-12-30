<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { useAuth } from './composables/useAuth'
import { useSeats } from './composables/useSeats'
import { useInvitations } from './composables/useInvitations'
import { cache, CacheKeys, CacheTTL } from './utils/cache'
import ToastContainer from './components/common/ToastContainer.vue'
import LoadingScreen from './components/layout/LoadingScreen.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const { authError, signInWithFeishu, checkAuthStatus, user } = useAuth()
const { loadAreas, loadSeatMap } = useSeats()
const { fetchInvitations } = useInvitations()

/**
 * 核心逻辑：检测是否有滚动条并切换 overscroll-behavior
 */
const checkScrollStatus = () => {
  nextTick(() => {
    const html = document.documentElement
    // scrollHeight 是内容实际高度，clientHeight 是视口高度
    const hasScroll = html.scrollHeight > html.clientHeight

    if (hasScroll) {
      // 页面内容多，开启回弹
      html.style.overscrollBehaviorY = 'auto'
    } else {
      // 页面内容少，禁止回弹，从而锁死飞书刷新栏导致的背景跳动
      html.style.overscrollBehaviorY = 'none'
    }
  })
}

// 路由变化时重新检测
watch(() => route.path, checkScrollStatus)

const isPreloading = ref(true)
// 预加载函数
async function preloadData() {
  try {
    // 并行预加载邀请状态、区域和座位数据
    await Promise.all([
      // 预加载邀请状态
      fetchInvitations(),

      // 预加载区域数据（使用缓存，30分钟有效）
      cache.getOrFetch(CacheKeys.SEAT_AREAS, () => loadAreas(), CacheTTL.LONG),

      // 预加载座位图数据（使用缓存，30分钟有效）
      cache.getOrFetch(CacheKeys.SEAT_MAP(), () => loadSeatMap(), CacheTTL.LONG),
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
    isPreloading.value = false
    console.log(isPreloading.value)
  } catch (err: any) {
    console.error('免登流程异常:', err)
    isPreloading.value = false
  }
})
</script>

<template>
  <!-- 登录和预加载状态共用LoadingScreen -->
  <LoadingScreen v-if="isPreloading" />

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

<style>
/* 当 NProgress 激活时，通过控制 bar 的存在来激活遮罩 */
#nprogress .spinner,
#nprogress .bar {
  z-index: 10001; /* 确保进度条在遮罩上方 */
}

/* 1. 定义背景呼吸动画 */
@keyframes mask-pulse {
  0% {
    background-color: rgba(255, 255, 255, 0.05);
  }
  50% {
    background-color: rgba(255, 255, 255, 0.15);
  }
  100% {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

/* 2. 增强 NProgress 进度条本身的质感 */
#nprogress .bar {
  background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%) !important; /* 渐变色 */
  height: 3px !important;
  box-shadow: 0 0 15px rgba(79, 172, 254, 0.7); /* 进度条发光 */
}

/* 3. 高级遮罩主体 */
#nprogress::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  /* 关键：使用带有透明度的径向渐变，模拟中心点光源 */
  background: radial-gradient(
    circle at 50% 0%,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );

  /* 毛玻璃深度感：稍微加大模糊，并配合呼吸动画 */
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);

  animation: mask-pulse 3s infinite ease-in-out;
  z-index: 10000;
  cursor: wait;
  pointer-events: all; /* 确保拦截所有点击 */
}

/* 4. 可选：增加一个微妙的网格纹理（极其高端的细节） */
#nprogress::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(#ffffff 0.5px, transparent 0.5px);
  background-size: 20px 20px;
  opacity: 0.05;
  z-index: 10001;
  pointer-events: none;
}
</style>
