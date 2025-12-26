/**
 * API 错误处理工具
 */

export interface ApiError {
  message: string
  code?: string
  status?: number
}

/**
 * 解析API错误并返回用户友好的错误消息
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function parseApiError(error: any): string {
  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error
  }

  // 如果有message字段
  if (error?.message) {
    return error.message
  }

  // 如果有data.message字段（后端返回的错误）
  if (error?.data?.message) {
    return error.data.message
  }

  // 如果有response.data.message字段（axios错误）
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  // 根据HTTP状态码返回默认消息
  if (error?.status || error?.response?.status) {
    const status = error.status || error.response.status
    switch (status) {
      case 400:
        return '请求参数错误'
      case 401:
        return '未登录或登录已过期，请重新登录'
      case 403:
        return '没有权限执行此操作'
      case 404:
        return '请求的资源不存在'
      case 500:
        return '服务器错误，请稍后重试'
      case 502:
      case 503:
      case 504:
        return '服务暂时不可用，请稍后重试'
      default:
        return `请求失败 (${status})`
    }
  }

  // 网络错误
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return '请求超时，请检查网络连接'
  }

  if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
    return '网络连接失败，请检查网络'
  }

  // 默认错误消息
  return '操作失败，请重试'
}

/**
 * 判断是否为认证错误
 * @param error 错误对象
 * @returns 是否为认证错误
 */
export function isAuthError(error: any): boolean {
  const status = error?.status || error?.response?.status
  return status === 401
}

/**
 * 判断是否为网络错误
 * @param error 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('timeout')
  )
}

/**
 * 创建标准化的API错误对象
 * @param message 错误消息
 * @param code 错误代码
 * @param status HTTP状态码
 * @returns 标准化的错误对象
 */
export function createApiError(message: string, code?: string, status?: number): ApiError {
  return {
    message,
    code,
    status,
  }
}
