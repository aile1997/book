/**
 * 数据缓存工具
 * 用于缓存API请求结果，减少不必要的网络请求
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache: Map<string, CacheItem<any>>
  private storageKey = 'app_cache'

  constructor() {
    this.cache = new Map()
    this.loadFromStorage()
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([key, value]) => {
          this.cache.set(key, value as CacheItem<any>)
        })
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
  }

  /**
   * 保存缓存到 localStorage
   */
  private saveToStorage() {
    try {
      const data: Record<string, CacheItem<any>> = {}
      this.cache.forEach((value, key) => {
        data[key] = value
      })
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
    }
  }

  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回 null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.saveToStorage()
      return null
    }

    return item.data as T
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 缓存有效期（毫秒），默认 5 分钟
   */
  set<T>(key: string, data: T, ttl: number = 300000) {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    
    this.cache.set(key, item)
    this.saveToStorage()
  }

  /**
   * 删除指定缓存
   * @param key 缓存键
   */
  delete(key: string) {
    this.cache.delete(key)
    this.saveToStorage()
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear()
    localStorage.removeItem(this.storageKey)
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在有效缓存
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * 获取缓存数据，如果不存在则调用 fetcher 获取并缓存
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param ttl 缓存有效期（毫秒）
   * @returns 缓存或新获取的数据
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      console.log(`Cache hit: ${key}`)
      return cached
    }

    console.log(`Cache miss: ${key}, fetching...`)
    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }
}

// 导出单例
export const cache = new CacheManager()

// 导出缓存键常量
export const CacheKeys = {
  // 用户相关
  USER_INFO: 'user_info',
  USER_CREDITS: 'user_credits',
  
  // 座位相关
  SEAT_AREAS: 'seat_areas',
  SEAT_TIME_SLOTS: 'seat_time_slots',
  SEAT_MAP: (areaId?: number) => `seat_map_${areaId || 'all'}`,
  SEAT_AVAILABILITY: (date: string, timeSlotId: number, areaId?: number) =>
    `seat_availability_${date}_${timeSlotId}_${areaId || 'all'}`,
  
  // 预订相关
  USER_BOOKINGS: 'user_bookings',
  USER_INVITATIONS: 'user_invitations',
  
  // 交易相关
  USER_TRANSACTIONS: 'user_transactions',
}

// 导出缓存有效期常量（毫秒）
export const CacheTTL = {
  SHORT: 60000, // 1 分钟
  MEDIUM: 300000, // 5 分钟
  LONG: 1800000, // 30 分钟
  VERY_LONG: 86400000, // 24 小时
}
