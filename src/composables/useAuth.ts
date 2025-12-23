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
      console.error('Token 无效或过期，请重新登录:', error)
      removeAuthToken()
      isAuthenticated.value = false
      user.value = null
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
 * 飞书免登操作
 */
async function signInWithFeishu() {
  isLoading.value = true
  authError.value = null
  try {
    // 1. 获取飞书临时 Code
    const code = await getLarkAuthCode()

    // 2. 传给后端换取用户信息和 Token
    const response = await loginWithFeishu(code)
    console.log(response)

    // 3. 存储 Token (注意：后端返回字段可能是 token 或 data.token，根据实际调整)
    const token = response.token || response.data?.token
    if (token) {
      setAuthToken(token)
    }

    isAuthenticated.value = true
    user.value = response.userInfo || response.data?.userInfo || response
    return response
  } catch (error: any) {
    authError.value = error.message || '飞书登录失败'
    isAuthenticated.value = false
    throw error
  } finally {
    isLoading.value = false
  }
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
    authError: computed(() => authError.value),
    signIn,
    signInWithFeishu,
    signOut,
    checkAuthStatus,
  }
}
