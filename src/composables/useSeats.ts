import { ref, computed } from 'vue'
import type { Seat } from '../types/booking'
import { useAuth } from './useAuth'
import { getSeatMap, getSeatAvailability, getAreas, getTimeSlots, postSeatAvailability } from '../api'
import {
  convertBackendMapToFrontendSeats,
  convertBackendAvailabilityToFrontend,
} from '../utils/dataAdapter'
import { cache, CacheKeys, CacheTTL } from '../utils/cache'

// 座位管理组合式函数 - 实现单例模式
let seatsInstance: ReturnType<typeof createSeatsStore> | null = null

function createSeatsStore() {
  // 所有座位数据 - 动态数据层
  const seats = ref<Seat[]>([])
  const areas = ref<any[]>([])
  const timeSlots = ref<any[]>([])
  const selectedTimeSlotId = ref<number | null>(null)

  const seatAvailability = ref<any[]>([])
  const isLoading = ref(false)
  const isLoadingTimeSlots = ref(false)
  const isLoadingAreas = ref(false)
  const isLoadingAvailability = ref(false)
  const error = ref<string | null>(null)

  // 请求时间戳，用于防止旧请求覆盖新请求的结果
  let lastAvailabilityRequestTime = 0

  /**
   * 从后端 API 加载座位平面图数据
   * @param {number} [areaId] - 可选的区域 ID
   */
  async function loadSeatMap(areaId?: number) {
    const targetAreaId = areaId

    isLoading.value = true
    error.value = null
    try {
      const data = await getSeatMap(targetAreaId)

      if (data && data.areas) {
        seats.value = convertBackendMapToFrontendSeats(data)
      } else {
        console.warn('API 返回结构不符合预期，使用默认座位数据。')
        seats.value = []
      }
      return data
    } catch (err: any) {
      error.value = '加载座位图失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
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

    console.log('从API加载座位图数据')
    const data = await loadSeatMap()

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
      return data
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

    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log('使用缓存的区域数据')
      areas.value = cached
      return cached
    }

    console.log('从API加载区域数据')
    const data = await loadAreas()

    if (data && Array.isArray(data) && data.length > 0) {
      cache.set(cacheKey, data, CacheTTL.LONG)
      return data
    }

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
      const data = response.data || response || []

      timeSlots.value = []
      selectedTimeSlotId.value = null

      return data
    } catch (err: any) {
      error.value = '加载时间段失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      return []
    } finally {
      isLoadingTimeSlots.value = false
    }
  }

  /**
   * 批量查询座位可用性（多时段支持）
   * @param queries - 查询参数数组
   */
  async function queryBatchSeatAvailability(queries: Array<{
    areaId: number
    bookingDate: string
    timeSlotId: number
  }>) {
    if (!queries || queries.length === 0) {
      console.warn('批量查询座位可用性失败：查询参数为空')
      return
    }

    const requestTime = Date.now()
    lastAvailabilityRequestTime = requestTime

    isLoadingAvailability.value = true
    error.value = null

    try {
      console.log('批量查询座位可用性，参数数量:', queries.length)
      const data = await postSeatAvailability(queries)

      if (requestTime < lastAvailabilityRequestTime) {
        console.log('检测到更新的请求，丢弃旧请求结果')
        return
      }

      console.log('批量查询到的座位可用性数据:', data)

      // 更新 seatAvailability 以便 FindPartnerModal 可以使用
      // 对于批量数据，我们使用第一个时段的数据填充 seatAvailability
      if (Array.isArray(data) && data.length > 0) {
        const firstSlotData = data[0]
        if (firstSlotData.seats && Array.isArray(firstSlotData.seats)) {
          seatAvailability.value = [...convertBackendAvailabilityToFrontend(firstSlotData.seats)]
          console.log('更新 seatAvailability，座位数量:', seatAvailability.value.length)
          // 触发座位状态更新
          updateSeatsStatus(data, true)
        }
      } else {
        seatAvailability.value = []
        updateSeatsStatus([], true)
      }
    } catch (err: any) {
      if (requestTime < lastAvailabilityRequestTime) {
        console.log('检测到更新的请求，忽略旧请求的错误')
        return
      }
      console.error('批量查询座位可用性失败:', err)
      error.value = '批量查询座位可用性失败: ' + (err.message || '未知错误')
      seatAvailability.value = []
      updateSeatsStatus([], true)
    } finally {
      if (requestTime === lastAvailabilityRequestTime) {
        isLoadingAvailability.value = false
      }
    }
  }

  /**
   * 查询座位可用性（单时段，向后兼容）
   */
  async function querySeatAvailability(bookingDate: string, timeSlotId: number, areaId?: number) {
    if (!bookingDate) {
      console.error('查询座位可用性失败: 预订日期不能为空')
      return
    }

    const requestTime = Date.now()
    lastAvailabilityRequestTime = requestTime

    const defaultAreaId = areas.value.length > 0 ? areas.value[0].id : undefined
    const targetAreaId = areaId ?? defaultAreaId

    isLoadingAvailability.value = true
    try {
      const params: { bookingDate: string; timeSlotId: number; areaId?: number } = {
        bookingDate,
        timeSlotId,
      }

      if (targetAreaId) {
        params.areaId = targetAreaId
      }

      console.log('正在查询座位可用性，参数:', params, '请求时间:', requestTime)
      const data = await getSeatAvailability(params)

      if (requestTime < lastAvailabilityRequestTime) {
        console.log('检测到更新的请求，丢弃旧请求结果')
        return
      }

      console.log('查询到的座位可用性数据:', data)

      if (data && Array.isArray(data)) {
        seatAvailability.value = [...convertBackendAvailabilityToFrontend(data)]
        console.log('转换后的座位可用性数据:', seatAvailability.value)
        seatAvailabilityChange(seatAvailability.value)
      } else {
        seatAvailability.value = []
        console.log('没有查询到座位可用性数据，已清空现有数据')
      }
    } catch (err: any) {
      if (requestTime < lastAvailabilityRequestTime) {
        console.log('检测到更新的请求，忽略旧请求的错误')
        return
      }
      console.error('查询座位可用性失败:', err)
      seatAvailability.value = []
    } finally {
      if (requestTime === lastAvailabilityRequestTime) {
        isLoadingAvailability.value = false
      }
    }
  }

  // 当前选中的座位
  const selectedSeat = ref<string | null>(null)

  /**
   * 更新座位状态（支持单时段或批量时段数据）
   * @param availabilityData - 可用性数据
   * @param isBatch - 是否为批量数据
   */
  const updateSeatsStatus = (availabilityData: any[], isBatch = false) => {
    const availabilityMap = new Map<number, any>()
    const currentUserId = useAuth(false).user.value?.id

    if (isBatch) {
      // 批量模式：只有在所有时段都可用时，座位才可用
      // 存储每个座位的可用性状态、预订信息和 bookingId
      const seatStatusMap = new Map<number, { isAvailable: boolean; bookingInfo: any; bookingId: number | null }>()

      availabilityData.forEach((slotData) => {
        if (slotData.seats && Array.isArray(slotData.seats)) {
          slotData.seats.forEach((seat: any) => {
            const existing = seatStatusMap.get(seat.seatId)
            const isMe = seat.bookingUserInfo?.userId === currentUserId

            if (!existing) {
              seatStatusMap.set(seat.seatId, {
                isAvailable: seat.isAvailable,
                bookingInfo: seat.bookingUserInfo,
                bookingId: isMe ? (seat.bookingId || seat.bookingUserInfo?.bookingId) : null,
              })
            } else {
              // 逻辑与：只要有一个时段不可用，整体就不可用
              existing.isAvailable = existing.isAvailable && seat.isAvailable
              // 如果当前时段有预订信息且之前没有，或者当前预订是我的，更新预订信息
              if (seat.bookingUserInfo && (!existing.bookingInfo || seat.bookingUserInfo.userId === currentUserId)) {
                existing.bookingInfo = seat.bookingUserInfo
                // 同时更新 bookingId
                existing.bookingId = seat.bookingId || seat.bookingUserInfo?.bookingId
              }
            }
          })
        }
      })

      seatStatusMap.forEach((status, seatId) => {
        availabilityMap.set(seatId, {
          isAvailable: status.isAvailable,
          bookingUserInfo: status.bookingInfo,
          bookingId: status.bookingId,
        })
      })
    } else {
      // 单时段模式
      availabilityData.forEach((item) => {
        if (typeof item === 'object') {
          availabilityMap.set(item.seatId, item)
        }
      })
    }

    seats.value = seats.value.map((seat) => {
      const availability = availabilityMap.get(seat.backendSeatId)

      // 保持当前选中状态，但如果该座位在当前时段不可用，则需要处理（通常在外部逻辑处理）
      const isCurrentlySelected = seat.status === 'selected' && seat.id === selectedSeat.value

      if (!availability) {
        return {
          ...seat,
          status: isCurrentlySelected ? 'selected' : 'available',
          occupiedBy: '',
          bookedByMe: false,
          bookingId: null,
        }
      }

      if (availability.isAvailable) {
        return {
          ...seat,
          status: isCurrentlySelected ? 'selected' : 'available',
          occupiedBy: '',
          bookedByMe: false,
          bookingId: null,
        }
      }

      const bookingUserInfo = availability.bookingUserInfo
      const isBookedByMe = bookingUserInfo?.userId === currentUserId

      // 获取 bookingId，已在批量模式中存储，或从单模式中获取
      const bookingId = isBookedByMe ? (availability.bookingId || bookingUserInfo?.bookingId) : null

      return {
        ...seat,
        status: isCurrentlySelected ? 'selected' : 'occupied',
        occupiedBy: bookingUserInfo
          ? bookingUserInfo.fullName || bookingUserInfo.username || '已预订'
          : '已预订',
        bookedByMe: isBookedByMe,
        bookingId: bookingId,
      }
    })
  }

  // 保持向后兼容
  const seatAvailabilityChange = (newAvailability: any[]) => updateSeatsStatus(newAvailability, false)

  // 根据桌子和位置获取座位
  const getSeatsByTable = (table: 'A' | 'B' | 'C', position: 'left' | 'right') => {
    return seats.value.filter((s) => s.table === table && s.position === position)
  }

  // 选择座位
  const selectSeat = (seatId: string) => {
    const seat = seats.value.find((s) => s.id === seatId)
    if (seat && seat.status === 'available') {
      seats.value.forEach((s) => {
        if (s.status === 'selected') {
          s.status = 'available'
        }
      })
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
        return '#A78BFA'
      case 'available':
        return '#6FCF97'
      case 'occupied':
        return '#CCCCCC'
      default:
        return '#CCCCCC'
    }
  }

  // 获取可用座位数量
  const availableSeatsCount = computed(() => {
    return seats.value.filter((s) => s.status === 'available').length
  })

  /**
   * 初始化函数
   */
  async function initialize() {
    await loadAreas()
    await loadSeatMap()
  }

  function setAreasData(data: any[]) {
    areas.value = data || []
  }

  function setSeatsData(data: any) {
    if (data && data.areas) {
      seats.value = convertBackendMapToFrontendSeats(data)
    } else {
      seats.value = []
    }
  }

  return {
    seats,
    areas,
    timeSlots,
    selectedTimeSlotId,
    initialize,
    seatAvailability,
    selectedSeat,
    availableSeatsCount,
    isLoading,
    isLoadingAreas,
    isLoadingTimeSlots,
    isLoadingAvailability,
    error,
    loadSeatMap,
    loadAreas,
    loadAreasWithCache,
    loadSeatMapWithCache,
    loadTimeSlots,
    setAreasData,
    setSeatsData,
    querySeatAvailability,
    queryBatchSeatAvailability,
    getSeatsByTable,
    selectSeat,
    clearSelection,
    getSeatColor,
    updateSeatsStatus,
  }
}

export function useSeats() {
  if (!seatsInstance) {
    seatsInstance = createSeatsStore()
  }
  return seatsInstance
}
