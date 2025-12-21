import { ref, computed } from 'vue';
import { login, logout, getCurrentUser, setAuthToken, removeAuthToken } from '../api';

// 认证状态
const isAuthenticated = ref(!!localStorage.getItem('authToken'));
const user = ref<any>(null);
const isLoading = ref(false);
const authError = ref<string | null>(null);

/**
 * 检查本地是否有 Token，并尝试获取用户信息
 */
async function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  if (token) {
    isAuthenticated.value = true;
    try {
      isLoading.value = true;
      // 尝试获取用户信息，验证 Token 有效性
      user.value = await getCurrentUser();
    } catch (error) {
      console.error('Token 无效或过期，请重新登录:', error);
      removeAuthToken();
      isAuthenticated.value = false;
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  } else {
    isAuthenticated.value = false;
    user.value = null;
  }
}

/**
 * 登录操作
 * @param {object} credentials - 登录凭证
 */
async function signIn(credentials: any) {
  isLoading.value = true;
  authError.value = null;
  try {
    const response = await login(credentials);
    // login 函数内部已经设置了 Token
    isAuthenticated.value = true;
    user.value = response.user; // 假设登录响应中包含用户信息
    return response;
  } catch (error: any) {
    authError.value = error.message || '登录失败';
    isAuthenticated.value = false;
    user.value = null;
    throw error;
  } finally {
    isLoading.value = false;
  }
}

/**
 * 登出操作
 */
async function signOut() {
  try {
    await logout();
  } catch (error) {
    console.error('登出失败，但已清除本地 Token:', error);
  } finally {
    removeAuthToken();
    isAuthenticated.value = false;
    user.value = null;
  }
}

/**
 * 认证状态管理 Composable
 */
export function useAuth() {
  // 首次加载时检查认证状态
  if (!user.value && isAuthenticated.value) {
    checkAuthStatus();
  }

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    user: computed(() => user.value),
    isLoading: computed(() => isLoading.value),
    authError: computed(() => authError.value),
    signIn,
    signOut,
    checkAuthStatus,
  };
}
