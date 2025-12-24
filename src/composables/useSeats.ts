import { ref, computed } from 'vue'
import type { Seat, Partner } from '../types/booking'
import { getSeatMap, getSeatAvailability, getAreas, getTimeSlots } from '../api' // 导入 API 客户端和新 API
import {
  convertBackendMapToFrontendSeats,
  convertBackendAvailabilityToFrontend,
} from '../utils/dataAdapter' // 导入数据适配器

// 座位管理组合式函数
export function useSeats() {
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

  /**
   * 从后端 API 加载座位平面图数据
   * @param {number} [areaId] - 可选的区域 ID
   */
  async function loadSeatMap(areaId?: number) {
    // 如果没有传入 areaId，尝试使用第一个区域的 ID
    const targetAreaId = areaId || (areas.value.length > 0 ? areas.value[0].id : undefined)

    if (!targetAreaId) {
      console.warn('无法加载座位图：没有可用的区域 ID。')
      return
    }

    isLoading.value = true
    error.value = null
    try {
      // 调用 API 获取座位图数据
      const data = await getSeatMap(targetAreaId)
    isLoading.value = true
    error.value = null
    try {
      // 调用 API 获取座位图数据
      const data = await getSeatMap(areaId)

      // 使用数据适配器转换后端数据到前端 Seat 结构
      if (data && data.areas) {
        seats.value = convertBackendMapToFrontendSeats(data)
      } else {
        // 如果 API 返回的不是预期的结构，使用默认数据（原文件中的数据）
        console.warn('API 返回结构不符合预期，使用默认座位数据。')
        // 为了简化，这里不再保留冗长的默认数据，而是清空，依赖用户初始化
        seats.value = []
      }
    } catch (err: any) {
      error.value = '加载座位图失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      // 失败时清空数据
      seats.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载区域列表
   */
  async function loadAreas() {
    isLoadingAreas.value = true
    try {
      const data = await getAreas()
      areas.value = data || []
    } catch (err: any) {
      error.value = '加载区域列表失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
    } finally {
      isLoadingAreas.value = false
    }
  }

  /**
   * 加载时间段列表
   */
  async function loadTimeSlots() {
    isLoadingTimeSlots.value = true
    try {
      const data = await getTimeSlots()
      timeSlots.value = data || []
      // 默认选中第一个时间段
      if (timeSlots.value.length > 0) {
        selectedTimeSlotId.value = timeSlots.value[0].id
      }
    } catch (err: any) {
      error.value = '加载时间段失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
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
   * @param areaId 区域 ID
   */
  async function querySeatAvailability(bookingDate: string, timeSlotId: number, areaId: number) {
    if (!bookingDate) {
      console.error('查询座位可用性失败: 预订日期不能为空')
      return
    }
    isLoadingAvailability.value = true
    try {
      const data = await getSeatAvailability({ bookingDate, timeSlotId, areaId })
      // 使用数据适配器转换后端可用性数据
      if (data && Array.isArray(data)) {
        seatAvailability.value = convertBackendAvailabilityToFrontend(data)
      }
    } catch (err: any) {
      console.error('查询座位可用性失败:', err)
    } finally {
      isLoadingAvailability.value = false
    }
  }

  // 当前选中的座位
  const selectedSeat = ref<string | null>(null)

  // 根据桌子和位置获取座位
  const getSeatsByTable = (table: 'A' | 'B' | 'C', position: 'left' | 'right') => {
    return seats.value.filter((s) => s.table === table && s.position === position)
  }

  // 选择座位
  const selectSeat = (seatId: string) => {
    const seat = seats.value.find((s) => s.id === seatId)
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
    await loadTimeSlots()

    // 3. 加载默认区域的座位图
    if (areas.value.length > 0) {
      await loadSeatMap(areas.value[0].id)
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
    loadTimeSlots, // 暴露加载时间段函数

    querySeatAvailability, // 暴露查询可用性函数
    getSeatsByTable,
    selectSeat,
    clearSelection,
    getSeatColor,
  }
}

// 伙伴管理组合式函数
export function usePartners() {
  // 伙伴数据暂时保留为本地模拟数据，因为 API 文档中没有直接获取所有伙伴的接口
  // 这里的伙伴数据应该从 /api/v1/users/search 或其他接口获取，目前先保留本地模拟数据
  const allPartners = ref<Partner[]>([
    // Table A 伙伴
    { id: '1', name: 'Mike Liao', table: 'A', seat: 'A1' },
    { id: '2', name: 'Eric Feng', table: 'A', seat: 'A4' },
    { id: '3', name: 'Sally Zhang', table: 'A', seat: 'A5' },
    { id: '4', name: 'Tom Li', table: 'A', seat: 'A6' },
    { id: '5', name: 'Oliver Huang', table: 'A', seat: 'A8' },
    { id: '6', name: 'Kong Lijun', table: 'A', seat: 'A12' },
    // Table B 伙伴
    { id: '7', name: 'Elsa Li', table: 'B', seat: 'B2' },
    { id: '8', name: 'Elsa Xu', table: 'B', seat: 'B3' },
    // Table C 伙伴
    { id: '9', name: 'Ethan Wei', table: 'C', seat: 'C1' },
    { id: '10', name: 'Eric Young Jung', table: 'C', seat: 'C2' },
    { id: '11', name: 'Elena Zhang', table: 'C', seat: 'C3' },
  ])

  // 根据桌子获取伙伴
  const getPartnersByTable = (table: string) => {
    return allPartners.value.filter((p) => p.table === table)
  }

  // 搜索伙伴
  const searchPartners = (query: string) => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()
    return allPartners.value.filter((p) => p.name.toLowerCase().includes(lowerQuery))
  }

  return {
    allPartners,
    getPartnersByTable,
    searchPartners,
  }
}
