import { ref, computed } from 'vue'
import {
  login,
  logout,
  getCurrentUser,
  setAuthToken,
  removeAuthToken,
  getLarkAuthCode,
  loginWithFeishu,
} from '../api'

// 认证状态
const isAuthenticated = ref(!!localStorage.getItem('authToken'))
const user = ref<any>(null)
const isLoading = ref(!!localStorage.getItem('authToken')) // 如果有token，初始就是加载中
const authError = ref<string | null>(null)

// 飞书静默登录状态
const isSilentLogin = ref(false)

/**
 * 检查本地是否有 Token，并尝试获取用户信息
 */
async function checkAuthStatus() {
  const token = localStorage.getItem('authToken')
  if (token) {
    isAuthenticated.value = true
    try {
      isLoading.value = true
      // 尝试获取用户信息，验证 Token 有效性
      user.value = await getCurrentUser()
    } catch (error: any) {
      console.error('Token 无效或过期，尝试静默重新登录:', error)
      // Token 无效或过期，尝试静默重新登录
      await silentLoginWithFeishu()
    } finally {
      isLoading.value = false
    }
  } else {
    isAuthenticated.value = false
    user.value = null
  }
}

/**
 * 登录操作
 * @param {object} credentials - 登录凭证
 */
async function signIn(
  credentials: any = {
    username: 'admin2',
    password: 'admin123',
  },
) {
  isLoading.value = true
  authError.value = null
  try {
    const response = await login(credentials)
    // login 函数内部已经设置了 Token
    isAuthenticated.value = true
    // 根据实际响应结构调整用户信息提取方式
    user.value = response.user || response.data?.user || response
    return response
  } catch (error: any) {
    authError.value = error.message || '登录失败'
    isAuthenticated.value = false
    user.value = null
    throw error
  } finally {
    isLoading.value = false
  }
}

/**
 * 登出操作
 */
async function signOut() {
  try {
    await logout()
  } catch (error: any) {
    console.error('登出失败，但已清除本地 Token:', error)
  } finally {
    removeAuthToken()
    isAuthenticated.value = false
    user.value = null
  }
}

/**
 * 飞书登录核心逻辑
 * @param isSilent - 是否为静默登录
 */
async function feishuLoginCore(isSilent: boolean) {
  const loginType = isSilent ? '静默登录' : '免登'
  const loadingRef = isSilent ? isSilentLogin : isLoading
  
  if (isSilent && loadingRef.value) return // 避免重复静默登录

  loadingRef.value = true
  authError.value = null
  
  try {
    // 1. 获取飞书临时 Code
    const code = await getLarkAuthCode()

    // 2. 传给后端换取用户信息和 Token
    const response = await loginWithFeishu(code)
    if (!isSilent) console.log(response) // 仅在非静默登录时打印

    // 3. 存储 Token
    const token = response.token || response.data?.token
    if (token) {
      setAuthToken(token)
    }

    isAuthenticated.value = true
    user.value = response.userInfo || response.data?.userInfo || response
    console.log(`飞书${loginType}成功。`)
    return response
  } catch (error: any) {
    authError.value = error.message || `飞书${loginType}失败`
    isAuthenticated.value = false
    console.error(`飞书${loginType}失败:`, error)
    
    if (isSilent) {
      // 静默登录失败，清除 Token
      removeAuthToken()
    }
    throw error
  } finally {
    loadingRef.value = false
  }
}

/**
 * 飞书免登操作
 */
async function signInWithFeishu() {
  return feishuLoginCore(false)
}

/**
 * 飞书静默登录操作
 */
async function silentLoginWithFeishu() {
  return feishuLoginCore(true)
}

/**
 * 认证状态管理 Composable
 */
export function useAuth() {
  // 首次加载时检查认证状态
  if (!user.value && isAuthenticated.value) {
    checkAuthStatus()
  }

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    user: computed(() => user.value),
    isLoading: computed(() => isLoading.value),
    isSilentLogin: computed(() => isSilentLogin.value), // 暴露静默登录状态
    authError: computed(() => authError.value),
    signIn,
    signInWithFeishu,
    signOut,
    checkAuthStatus,
    silentLoginWithFeishu, // 暴露静默登录函数
  }
}
