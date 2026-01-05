import { ref, computed } from 'vue'
import type { Seat } from '../types/booking'
import { useAuth } from './useAuth'
import { getSeatMap, getSeatAvailability, getAreas, getTimeSlots } from '../api' // 导入 API 客户端和新 API
import {
  convertBackendMapToFrontendSeats,
  convertBackendAvailabilityToFrontend,
} from '../utils/dataAdapter' // 导入数据适配器
import { cache, CacheKeys, CacheTTL } from '../utils/cache' // 导入缓存工具

// 座位管理组合式函数 - 实现单例模式
let seatsInstance: ReturnType<typeof createSeatsStore> | null = null

function createSeatsStore() {
  // 所有座位数据 - 动态数据层
  const seats = ref<Seat[]>([])
  const areas = ref<any[]>([]) // 区域列表
  const timeSlots = ref<any[]>([]) // 时间段列表
  const selectedTimeSlotId = ref<number | null>(null) // 默认选中的时间段 ID

  const seatAvailability = ref<any[]>([]) // 新增：座位可用性数据
  const isLoading = ref(false)
  const isLoadingTimeSlots = ref(false)
  const isLoadingAreas = ref(false)

  const isLoadingAvailability = ref(false) // 加载可用性状态
  const error = ref<string | null>(null)

  // 请求时间戳，用于防止旧请求覆盖新请求的结果
  let lastAvailabilityRequestTime = 0

  /**
   * 从后端 API 加载座位平面图数据
   * @param {number} [areaId] - 可选的区域 ID
   */
  async function loadSeatMap(areaId?: number) {
    // 如果传入了 areaId，则只加载该区域的座位图。
    // 如果没有传入 areaId，则加载所有区域的座位图。
    const targetAreaId = areaId

    isLoading.value = true
    error.value = null
    try {
      // 调用 API 获取座位图数据
      // 如果 targetAreaId 为 undefined，getSeatMap 将不带参数调用，返回所有区域数据
      const data = await getSeatMap(targetAreaId)

      // 使用数据适配器转换后端数据到前端 Seat 结构
      if (data && data.areas) {
        seats.value = convertBackendMapToFrontendSeats(data)
      } else {
        // 如果 API 返回的不是预期的结构，使用默认数据（原文件中的数据）
        console.warn('API 返回结构不符合预期，使用默认座位数据。')
        // 为了简化，这里不再保留冗长的默认数据，而是清空，依赖用户初始化
        seats.value = []
      }
      return data // 返回数据以便缓存
    } catch (err: any) {
      error.value = '加载座位图失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      // 失败时清空数据
      seats.value = []
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 从缓存或API加载座位平面图数据
   */
  async function loadSeatMapWithCache() {
    const cacheKey = CacheKeys.SEAT_MAP()
    const cached = cache.get(cacheKey)

    // 如枟缓存存在且有效，直接更新响应式数据
    if (
      cached &&
      typeof cached === 'object' &&
      'areas' in cached &&
      Array.isArray(cached.areas) &&
      cached.areas.length > 0
    ) {
      console.log('使用缓存的座位图数据')
      seats.value = convertBackendMapToFrontendSeats(cached as { areas: any[] })
      return cached
    }

    // 缓存不存在或无效，从API加载
    console.log('从API加载座位图数据')
    const data = await loadSeatMap()

    // 只有当数据有效时才缓存
    if (
      data &&
      typeof data === 'object' &&
      'areas' in data &&
      Array.isArray(data.areas) &&
      data.areas.length > 0
    ) {
      cache.set(cacheKey, data, CacheTTL.LONG)
      return data
    }

    // 数据无效，返回null但不缓存
    console.warn('加载的座位图数据无效，不进行缓存')
    return null
  }

  /**
   * 加载区域列表
   */
  async function loadAreas() {
    isLoadingAreas.value = true
    try {
      const data = await getAreas()
      areas.value = data || []
      return data // 返回数据以便缓存
    } catch (err: any) {
      error.value = '加载区域列表失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      return []
    } finally {
      isLoadingAreas.value = false
    }
  }

  /**
   * 从缓存或API加载区域列表
   */
  async function loadAreasWithCache() {
    const cacheKey = CacheKeys.SEAT_AREAS
    const cached = cache.get(cacheKey)

    // 如枟缓存存在且有效，直接更新响应式数据
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log('使用缓存的区域数据')
      areas.value = cached
      return cached
    }

    // 缓存不存在或无效，从API加载
    console.log('从API加载区域数据')
    const data = await loadAreas()

    // 只有当数据有效时才缓存
    if (data && Array.isArray(data) && data.length > 0) {
      cache.set(cacheKey, data, CacheTTL.LONG)
      return data
    }

    // 数据无效，返回空数组但不缓存
    console.warn('加载的区域数据无效，不进行缓存')
    return []
  }

  /**
   * 加载时间段列表
   */
  async function loadTimeSlots() {
    isLoadingTimeSlots.value = true
    try {
      const response = await getTimeSlots()
      // 使用用户指定的获取数据逻辑
      const data = response.data || response || []

      // 确保 timeSlots 变量是空的，避免类型冲突
      timeSlots.value = []
      selectedTimeSlotId.value = null

      // 返回原始数据，供 BookingPage.vue 自己处理
      return data
    } catch (err: any) {
      error.value = '加载时间段失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      return []
    } finally {
      isLoadingTimeSlots.value = false
    }
  }

  // 首次加载时调用
  // 移除自动调用，让外部组件决定何时调用，特别是需要 areaId 时
  // if (seats.value.length === 0) {
  //   loadSeatMap()
  // }

  /**
   * 查询座位可用性
   * @param bookingDate 预订日期 (YYYY-MM-DD)
   * @param timeSlotId 时间段 ID (0 或 1)
   * @param areaId 区域 ID (可选，如果传入则只查询该区域)
   */
  async function querySeatAvailability(bookingDate: string, timeSlotId: number, areaId?: number) {
    if (!bookingDate) {
      console.error('查询座位可用性失败: 预订日期不能为空')
      return
    }

    // 记录本次请求的时间戳
    const requestTime = Date.now()
    lastAvailabilityRequestTime = requestTime

    // 默认使用第一个区域的 ID
    const defaultAreaId = areas.value.length > 0 ? areas.value[0].id : undefined
    const targetAreaId = areaId ?? defaultAreaId

    isLoadingAvailability.value = true
    try {
      const params: { bookingDate: string; timeSlotId: number; areaId?: number } = {
        bookingDate,
        timeSlotId,
      }

      // 只有当 targetAreaId 存在时才添加到参数中
      if (targetAreaId) {
        params.areaId = targetAreaId
      }

      console.log('正在查询座位可用性，参数:', params, '请求时间:', requestTime)
      const data = await getSeatAvailability(params)

      // 检查是否有更新的请求，如果有则丢弃当前结果
      if (requestTime < lastAvailabilityRequestTime) {
        console.log('检测到更新的请求，丢弃旧请求结果', {
          requestTime,
          lastAvailabilityRequestTime,
        })
        return
      }

      console.log('查询到的座位可用性数据:', data)

      // 使用数据适配器转换后端可用性数据
      if (data && Array.isArray(data)) {
        // 确保每次都更新seatAvailability，即使数据相同
        seatAvailability.value = [...convertBackendAvailabilityToFrontend(data)]
        console.log('转换后的座位可用性数据:', seatAvailability.value)
        seatAvailabilityChange(seatAvailability.value)
      } else {
        // 如果没有数据，清空现有的可用性数据
        seatAvailability.value = []
        console.log('没有查询到座位可用性数据，已清空现有数据')
      }
    } catch (err: any) {
      // 同样检查是否有更新的请求
      if (requestTime < lastAvailabilityRequestTime) {
        console.log('检测到更新的请求，忽略旧请求的错误')
        return
      }
      console.error('查询座位可用性失败:', err)
      // 出错时清空数据，防止旧数据影响
      seatAvailability.value = []
    } finally {
      // 只有当前请求是最新的请求时才更新 loading 状态
      if (requestTime === lastAvailabilityRequestTime) {
        isLoadingAvailability.value = false
      }
    }
  }

  // 当前选中的座位
  const selectedSeat = ref<string | null>(null)

  const seatAvailabilityChange = (newAvailability: any[]) => {
    // 创建一个 Map，方便查找
    const availabilityMap = new Map(
      newAvailability
        .filter((item) => typeof item === 'object')
        .map((item: any) => [item.seatId, item]),
    )
    console.log('Availability data:', newAvailability)

    // 通过创建新数组来触发响应式更新
    seats.value = seats.value.map((seat) => {
      const availability = availabilityMap.get(seat.backendSeatId)
      console.log(`Seat ${seat.id} availability:`, availability)

      // 如果没有可用性信息，默认该座位为可用（除非它当前被选中）
      if (!availability) {
        return {
          ...seat,
          status: seat.status === 'selected' ? 'selected' : 'available',
          occupiedBy: '',
        }
      }

      // 检查availability是否具有expected属性
      if (typeof availability === 'object' && availability.isAvailable) {
        // 如果当前座位是被选中的，保持选中状态，否则设为可用
        return {
          ...seat,
          status:
            seat.status === 'selected' && seat.id === selectedSeat.value ? 'selected' : 'available',
          occupiedBy: '',
        }
      }

      // 如果座位不可用（已被预订或锁定）
      const bookingUserInfo = typeof availability === 'object' ? availability.bookingUserInfo : null
      const isBookedByMe = bookingUserInfo?.userId === useAuth().user.value?.id
      return {
        ...seat,
        status: 'occupied',
        occupiedBy:
          bookingUserInfo
            ? bookingUserInfo.fullName ||
              bookingUserInfo.username ||
              '已预订'
            : '已预订',
        bookedByMe: isBookedByMe,
        // 如果是我预订的，保存预订信息，方便后续取消
        bookingId: isBookedByMe ? availability.bookingId : null
      }
    })
  }

  // 根据桌子和位置获取座位
  const getSeatsByTable = (table: 'A' | 'B' | 'C', position: 'left' | 'right') => {
    return seats.value.filter((s) => s.table === table && s.position === position)
  }

  // 选择座位
  const selectSeat = (seatId: string) => {
    const seat = seats.value.find((s) => s.id === seatId)
    // 修改逻辑：只有状态为 available 的座位才能被选中，禁止选择已预定的座位
    if (seat && seat.status === 'available') {
      // 取消之前选中的座位
      seats.value.forEach((s) => {
        if (s.status === 'selected') {
          s.status = 'available'
        }
      })

      // 选中新座位
      seat.status = 'selected'
      selectedSeat.value = seatId
    }
  }

  // 取消选择
  const clearSelection = () => {
    seats.value.forEach((s) => {
      if (s.status === 'selected') {
        s.status = 'available'
      }
    })
    selectedSeat.value = null
  }

  // 获取座位颜色
  const getSeatColor = (seat: Seat): string => {
    switch (seat.status) {
      case 'selected':
        return '#A78BFA' // 紫色 - 选中
      case 'available':
        return '#6FCF97' // 绿色 - 可用
      case 'occupied':
        return '#CCCCCC' // 灰色 - 已占用
      default:
        return '#CCCCCC'
    }
  }

  // 获取可用座位数量
  const availableSeatsCount = computed(() => {
    return seats.value.filter((s) => s.status === 'available').length
  })

  /**
   * 初始化函数：加载区域、时间段和默认座位图
   */
  async function initialize() {
    // 1. 加载区域列表
    await loadAreas()

    // 2. 加载时间段列表
    // 移除 loadTimeSlots 的调用，让 BookingPage.vue 自己管理时间段数据
    // await loadTimeSlots()

    // 3. 加载所有区域的座位图 (不传 areaId)
    await loadSeatMap()
  }

  /**
   * 直接设置区域数据（用于从缓存更新）
   */
  function setAreasData(data: any[]) {
    areas.value = data || []
  }

  /**
   * 直接设置座位数据（用于从缓存更新）
   */
  function setSeatsData(data: any) {
    if (data && data.areas) {
      seats.value = convertBackendMapToFrontendSeats(data)
    } else {
      seats.value = []
    }
  }

  return {
    seats,
    areas, // 暴露区域列表
    timeSlots, // 暴露时间段列表
    selectedTimeSlotId, // 暴露选中的时间段 ID
    initialize, // 暴露初始化函数

    seatAvailability, // 暴露可用性数据
    selectedSeat,
    availableSeatsCount,
    isLoading,
    isLoadingAreas, // 暴露区域加载状态
    isLoadingTimeSlots, // 暴露时间段加载状态
    isLoadingAvailability, // 暴露可用性加载状态
    error,
    loadSeatMap, // 暴露加载座位图函数
    loadAreas, // 暴露加载区域函数
    loadAreasWithCache, // 暴露带缓存的加载区域函数
    loadSeatMapWithCache, // 暴露带缓存的加载座位图函数
    loadTimeSlots, // 暴露加载时间段函数
    setAreasData, // 暴露设置区域数据函数
    setSeatsData, // 暴露设置座位数据函数

    querySeatAvailability, // 暴露查询可用性函数
    getSeatsByTable,
    selectSeat,
    clearSelection,
    getSeatColor,
  }
}

// 座位管理组合式函数
export function useSeats() {
  if (!seatsInstance) {
    seatsInstance = createSeatsStore()
  }
  return seatsInstance
}
