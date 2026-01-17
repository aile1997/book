import axios from 'axios'
import { parseApiError } from '../utils/errorHandler'

// API 基础 URL，根据用户提供的 Swagger 文档地址
const BASE_URL = ''
// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 1000000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

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

// 全局401重登录锁，防止多个401同时触发重登录
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
  config: any
}> = []

/**
 * 处理队列中的请求
 * 修复竞态条件：添加重试计数器和 token 检查
 */
const processQueue = (error: any = null, newToken?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      // 检查 token 是否存在
      if (!newToken) {
        prom.reject(new Error('刷新令牌失败：未获取到新令牌'))
        return
      }

      // 更新请求头
      prom.config.headers.Authorization = `Bearer ${newToken}`

      // 添加重试计数器，防止无限循环
      prom.config._retryCount = (prom.config._retryCount || 0) + 1
      if (prom.config._retryCount > 2) {
        prom.reject(new Error('请求重试次数超限'))
        return
      }

      // 重新发送请求
      apiClient(prom.config).then(prom.resolve).catch(prom.reject)
    }
  })
  failedQueue = []
}

// 响应拦截器：处理全局错误，例如 401 未授权
apiClient.interceptors.response.use(
  (response) => {
    // console.log(response) // 移除不必要的日志
    // 正确处理响应数据，兼容不同格式
    if (response.data?.result !== undefined) {
      return response.data.result
    }
    if (response.data?.data !== undefined) {
      return response.data.data
    }
    if (response.data?.data?.data !== undefined) {
      return response.data.data.data
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // 添加用户友好的错误消息
    const errorMessage = parseApiError(error)
    error.userMessage = errorMessage

    // 检查是否是 401 错误
    if (error.response && error.response.status === 401) {
      // 如果已经在重登录，将当前请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      // 标记为正在重登录
      isRefreshing = true

      // 动态导入 useAuth 模块，避免循环依赖
      const { useAuth } = await import('../composables/useAuth')
      const { silentLoginWithFeishu } = useAuth(false)
      try {
        // 尝试静默登录获取新 Token
        await silentLoginWithFeishu()

        // 获取新 token 并传递给 processQueue
        const newToken = localStorage.getItem('authToken')

        // 重登录成功，处理队列中的请求（传递新 token）
        processQueue(null, newToken || undefined)
        isRefreshing = false

        // 重新设置 Authorization header
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }

        // 使用新的 Token 重新发送当前请求
        return apiClient(originalRequest)
      } catch (e) {
        // 静默登录失败，处理队列中的请求
        processQueue(e)
        isRefreshing = false
        removeAuthToken()
        console.error('静默登录失败，请重新登录。')
        return Promise.reject(error)
      }
    }

    // 抛出包含后端错误信息的 Promise
    return Promise.reject(error.response?.data || error)
  },
)

// --- 新增：飞书 JS-SDK 获取 Code ---
export const getLarkAuthCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 非飞书环境：本地调试模式
    if (!window.h5sdk) {
      return resolve('ezPqxd9J6zHeAbzH9K8f9684HAf5e829')
    }

    // 飞书环境：正常获取 code
    window.h5sdk.ready(() => {
      // 注意：飞书 SDK 全局变量是 tt
      tt.requestAuthCode({
        appId: import.meta.env.VITE_LARK_APP_ID,
        scopeList: [],
        success: (res) => {
          // 缓存 code 供本地调试使用
          localStorage.setItem('debug_lark_code', res.code)
          console.log('飞书 code 已缓存:', res.code)
          resolve(res.code)
        },
        fail: (err) => {
          console.error('Code 获取失败:', err)
          window.location.href = '/'
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

// -----------------------------------------------------------------------------
// 认证相关 API
// -----------------------------------------------------------------------------

/**
 * 用户登录
 * @param {object} credentials - 包含 username 和 password 的对象
 * @returns {Promise<object>} 包含 Token 和用户信息的响应
 */
export async function login(credentials: any): Promise<any> {
  const response = await apiClient.post('/api/v1/auth/login', credentials)
  // 登录成功后，存储 Token
  if (response && response.token) {
    setAuthToken(response.token)
  }
  return response
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
  const response = await apiClient.post('/api/v1/auth/logout')
  removeAuthToken()
  return response
}

// -----------------------------------------------------------------------------
// 用户信息相关 API
// -----------------------------------------------------------------------------

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
// 用户信息相关 API
// -----------------------------------------------------------------------------

/**
 * 搜索用户
 * @param {string} code - 飞书认证 Code
 * @param {string} query - 搜索关键词
 * @param {number} [limit] - 限制返回数量
 * @returns {Promise<object>} 用户列表
 */
export async function searchUsers(code: string, query: string, limit?: number): Promise<any> {
  const params = { code, q: query, limit }
  return apiClient.get('/api/v1/users/search', { params })
}

/**
 * 检查用户是否已存在预订
 * @param {object} params - 参数对象
 * @param {string} params.feishuUserId - 飞书用户 ID
 * @param {string} params.bookingDate - 预订日期
 * @param {number} params.timeSlotId - 时间段 ID
 * @param {number} [params.areaId] - 区域 ID（可选）
 * @returns {Promise<object>} 包含是否存在预订的信息
 */
export async function checkUserExists(params: {
  feishuUserId: string
  bookingDate: string
  timeSlotId: number
  areaId?: number // 设为可选
}): Promise<any> {
  const { feishuUserId, bookingDate, timeSlotId, areaId } = params
  return apiClient.get('/api/v1/users/exists', {
    params: {
      feishuUserId,
      bookingDate,
      timeSlotId,
      areaId,
    },
  })
}

// -----------------------------------------------------------------------------
// 管理员相关 API
// -----------------------------------------------------------------------------

/**
 * 创建新区域
 * @param {object} areaData - 区域数据
 * @returns {Promise<object>} 创建成功的响应
 */
export async function createArea(areaData: any): Promise<any> {
  return apiClient.post('/api/v1/admin/areas', areaData)
}

/**
 * 删除区域
 * @param {number} areaId - 区域 ID
 * @returns {Promise<object>} 删除成功的响应
 */
export async function deleteArea(areaId: number): Promise<any> {
  return apiClient.delete(`/api/v1/admin/areas/${areaId}`)
}

/**
 * 批量创建座位
 * @param {object} seatsData - 包含 seats 数组的对象
 * @returns {Promise<object>} 批量创建成功的响应
 */
export async function batchCreateSeats(seatsData: any): Promise<any> {
  return apiClient.post('/api/v1/admin/seats/batch', seatsData)
}

/**
 * 删除座位
 * @param {number} seatId - 座位 ID
 * @returns {Promise<object>} 删除成功的响应
 */
export async function deleteSeat(seatId: number): Promise<any> {
  return apiClient.delete(`/api/v1/admin/seats/${seatId}`)
}

// -----------------------------------------------------------------------------
// 预订相关 API
// -----------------------------------------------------------------------------

/**
 * 创建预订（新版：支持多时段）
 * @param {object} bookingData - 预订数据，包含座位 ID 和多时段数组等
 * @returns {Promise<object>} 预订成功的响应
 */
export async function createBooking(bookingData: {
  areaId: number
  seatId: number
  timeSlots: Array<{
    bookingDate: string
    timeSlotId: number
  }>
  invitePartners?: {
    userId: string
    openId: string
    username: string
    seatId: number
  }[]
}): Promise<any> {
  return apiClient.post('/api/v1/bookings', bookingData)
}

/**
 * 批量查询座位可用性（新版：POST 方法）
 * @param {Array} queries - 查询参数数组
 * @returns {Promise<object>} 座位可用性数据
 */
export async function postSeatAvailability(
  queries: Array<{
    areaId: number
    bookingDate: string
    timeSlotId: number
  }>,
): Promise<any> {
  return apiClient.post('/api/v1/seats/availability', queries)
}

/**
 * 换座（新版：支持邀请伙伴）
 * @param {object} request - 换座请求数据
 * @returns {Promise<object>} 换座成功的响应
 */
export async function swapSeat(request: {
  bookingId: number
  newSeatId: number
  invitePartners?: Array<{
    userId: string
    openId: string
    username: string
    seatId: number
  }>
}): Promise<any> {
  return apiClient.put('/api/v1/bookings/swap-seat', request)
}

/**
 * 获取我的预订列表（支持分页）
 * @param {object} params - 分页参数
 * @returns {Promise<object>} 预订列表
 */
export async function getMyBookings(params: { skip: number; limit: number }): Promise<any> {
  return apiClient.get('/api/v1/bookings', { params })
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
 * @param {number} bookingId - 预订 ID
 * @returns {Promise<object>} 取消成功的响应
 */
export async function cancelBooking(bookingId: number): Promise<any> {
  return apiClient.delete(`/api/v1/bookings/${bookingId}`)
}

// -----------------------------------------------------------------------------
// 座位相关 API
// -----------------------------------------------------------------------------

/**
 * 获取所有区域列表
 * @returns {Promise<object>} 区域列表数据
 */
export async function getAreas(): Promise<any> {
  return apiClient.get('/api/v1/seats/areas')
}

/**
 * 获取座位平面图数据
 * @param {number} [areaId] - 可选的区域 ID
 * @returns {Promise<object>} 座位图数据
 */
export async function getSeatMap(areaId?: number): Promise<any> {
  const params = areaId ? { areaId } : {}
  return apiClient.get('/api/v1/seats/map', { params })
}

/**
 * 查询座位可用性
 * @param {object} query - 查询参数 { bookingDate: string, timeSlotId: number, areaId: number }
 * @returns {Promise<object>} 座位可用性数据
 */
export async function getSeatAvailability(query: {
  bookingDate: string
  timeSlotId: number
  areaId?: number // 设为可选
}): Promise<any> {
  return apiClient.get('/api/v1/seats/availability', { params: query })
}

/**
 * 获取可预订时间段列表
 * @returns {Promise<object>} 时间段列表
 */
export async function getTimeSlots(): Promise<any> {
  return apiClient.get('/api/v1/seats/timeslots')
}

// -----------------------------------------------------------------------------
// 伙伴邀请相关 API
// -----------------------------------------------------------------------------

/**
 * 轮询获取未来邀请列表
 * @returns {Promise<object>} 未来邀请列表
 */
export async function getUpcomingInvitations(): Promise<any> {
  return apiClient.get('/api/v1/partner-invitations/upcoming')
}

/**
 * 拒绝邀请
 * @param {number} invitationId - 邀请 ID
 * @returns {Promise<object>} 拒绝成功的响应
 */
export async function declineInvitation(invitationId: number): Promise<any> {
  return apiClient.post(`/api/v1/partner-invitations/${invitationId}/decline`)
}

/**
 * 接受邀请
 * @param {number} invitationId - 邀请 ID
 * @returns {Promise<object>} 接受成功的响应
 */
export async function acceptInvitation(invitationId: number): Promise<any> {
  return apiClient.post(`/api/v1/partner-invitations/${invitationId}/accept`)
}

// 导出 apiClient 实例，以便在需要时进行更灵活的请求
export default apiClient
