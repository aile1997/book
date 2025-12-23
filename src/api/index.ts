import axios from 'axios'

// API 基础 URL，根据 Swagger 文档提供的 Ngrok 地址
const BASE_URL = import.meta.env.DEV ? '' : 'http://你的生产环境域名'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- 新增：飞书 JS-SDK 获取 Code ---
export const getLarkAuthCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.h5sdk) {
      return reject(new Error('非飞书环境或 SDK 未加载'))
    }
    window.h5sdk.ready(() => {
      // 注意：飞书 SDK 全局变量是 tt
      tt.requestAuthCode({
        appId: import.meta.env.VITE_LARK_APP_ID,
        scopeList: [],
        success: (res) => resolve(res.code),
        fail: (err) => {
          console.error('Code 获取失败:', err)
          reject(err)
        },
      })
    })
  })
}

// --- 新增：对接后端飞书登录接口 ---
export async function loginWithFeishu(code: string): Promise<any> {
  // 使用之前配置的 apiClient，会自动处理 BASE_URL 和 headers
  return apiClient.post('/api/v1/auth/feishu/callback', { code })
}

/**
 * 获取存储在本地的认证 Token
 * @returns {string | null} JWT Token
 */
function getAuthToken(): string | null {
  // 假设 Token 存储在 localStorage 中
  return localStorage.getItem('authToken')
}

/**
 * 存储认证 Token 到本地
 * @param {string} token JWT Token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token)
}

/**
 * 移除本地存储的认证 Token
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken')
}

// 请求拦截器：在发送请求前，如果存在 Token，则将其添加到请求头中
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      // 假设后端使用 Bearer 认证
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器：处理全局错误，例如 401 未授权
apiClient.interceptors.response.use(
  (response) => {
    console.log(response)

    // 正确处理响应数据，兼容不同格式
    if (response.data?.result !== undefined) {
      return response.data.result
    }
    if (response.data?.data !== undefined) {
      return response.data.data
    }
    return response.data
  },
  (error) => {
    console.log(error)
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        // Token 过期或无效，清除本地 Token 并重定向到登录页
        // removeAuthToken()
        // 实际应用中应进行路由跳转，这里仅清除 Token
        console.error('认证失败，请重新登录。')
      }
      // 抛出包含后端错误信息的 Promise
      return Promise.reject(
        new Error(
          error.response.data?.message ||
            error.response.data?.error ||
            error.response.statusText ||
            '请求失败',
        ),
      )
    }
    if (error.request) {
      // 请求已发出但没有收到响应
      return Promise.reject(new Error('网络连接异常，请检查网络设置'))
    }
    return Promise.reject(new Error('请求配置错误'))
  },
)

// -----------------------------------------------------------------------------
// 认证相关 API
// -----------------------------------------------------------------------------

/**
 * 用户登录
 * @param {object} credentials - 包含 username 和 password 的对象
 * @returns {Promise<object>} 包含 Token 和用户信息的响应
 */
export async function login(credentials: any): Promise<any> {
  try {
    const response = await apiClient.post('/api/v1/auth/login', credentials)
    // 登录成功后，存储 Token
    if (response && response.token) {
      setAuthToken(response.token)
    }
    return response.data || response
  } catch (error) {
    // 登录失败时清除可能存在的旧 Token
    // removeAuthToken()
    throw error
  }
}

/**
 * 用户注册
 * @param {object} userData - 包含注册信息的对象
 * @returns {Promise<object>} 注册成功的响应
 */
export async function register(userData: any): Promise<any> {
  return apiClient.post('/api/v1/auth/register', userData)
}

/**
 * 用户登出
 * @returns {Promise<object>} 登出成功的响应
 */
export async function logout(): Promise<any> {
  try {
    const response = await apiClient.post('/api/v1/auth/logout')
    return response
  } finally {
    // 无论请求成功与否都清除本地 Token
    removeAuthToken()
  }
}

// -----------------------------------------------------------------------------
// 用户信息相关 API
// -----------------------------------------------------------------------------

/**
 * 获取当前登录用户信息
 * @returns {Promise<object>} 用户信息
 */
export async function getFeishuUser(): Promise<any> {
  return apiClient.get('/api/v1/auth/feishu/login')
}

/**
 * 获取当前登录用户信息
 * @returns {Promise<object>} 用户信息
 */
export async function getCurrentUser(): Promise<any> {
  return apiClient.get('/api/v1/users/me')
}

/**
 * 获取当前用户积分余额
 * @returns {Promise<object>} 积分余额信息
 */
export async function getUserCredits(): Promise<any> {
  return apiClient.get('/api/v1/users/me/credits')
}

/**
 * 获取当前用户的积分交易记录
 * @returns {Promise<object>} 积分交易记录列表
 */
export async function getUserTransactions(): Promise<any> {
  return apiClient.get('/api/v1/users/me/transactions')
}

// -----------------------------------------------------------------------------
// 预订相关 API
// -----------------------------------------------------------------------------

/**
 * 创建预订
 * @param {object} bookingData - 预订数据，包含座位 ID 和时间等
 * @returns {Promise<object>} 预订成功的响应
 */
export async function createBooking(bookingData: any): Promise<any> {
  return apiClient.post('/api/v1/bookings', bookingData)
}

/**
 * 获取用户预订列表
 * @returns {Promise<object>} 预订列表
 */
export async function getUserBookings(): Promise<any> {
  return apiClient.get('/api/v1/bookings')
}

/**
 * 取消预订
 * @param {string} bookingId - 预订 ID
 * @returns {Promise<object>} 取消成功的响应
 */
export async function cancelBooking(bookingId: string): Promise<any> {
  return apiClient.delete(`/api/v1/bookings/${bookingId}`)
}

// -----------------------------------------------------------------------------
// 座位相关 API
// -----------------------------------------------------------------------------

/**
 * 获取座位平面图数据
 * @returns {Promise<object>} 座位图数据
 */
export async function getSeatMap(): Promise<any> {
  return apiClient.get('/api/v1/seats/map')
}

// 导出 apiClient 实例，以便在需要时进行更灵活的请求
export default apiClient
