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
    
    // 默认使用第一个区域的 ID
    const defaultAreaId = areas.value.length > 0 ? areas.value[0].id : undefined
    const targetAreaId = areaId ?? defaultAreaId

    isLoadingAvailability.value = true
    try {
      const params: { bookingDate: string; timeSlotId: number; areaId?: number } = { bookingDate, timeSlotId }
      
      // 只有当 targetAreaId 存在时才添加到参数中
      if (targetAreaId) {
        params.areaId = targetAreaId
      }
      const data = await getSeatAvailability(params)
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
    // 移除 loadTimeSlots 的调用，让 BookingPage.vue 自己管理时间段数据
    // await loadTimeSlots()

    // 3. 加载所有区域的座位图 (不传 areaId)
    await loadSeatMap()
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
  // 引入 useSeats 来获取 seatAvailability 和 seats
  const { seatAvailability, seats } = useSeats()

  // 计算属性：获取所有存在的桌子及其座位
  const allTables = computed(() => {
    const tables: { [key: string]: Seat[] } = {}
    seats.value.forEach(seat => {
      const tableId = seat.table as string
      if (!tables[tableId]) {
        tables[tableId] = []
      }
      tables[tableId].push(seat)
    })
    // 对每个桌子的座位进行排序，确保渲染顺序正确
    Object.values(tables).forEach(seatList => {
      seatList.sort((a, b) => {
        if (a.position === b.position) {
          return a.index - b.index
        }
        // 确保 left 在 right 之前
        return a.position === 'left' ? -1 : 1
      })
    })
    return tables
  })

  // 计算属性：从 seatAvailability 中提取已预订座位的人员信息
  const bookedPartners = computed<Partner[]>(() => {
    const partners: Partner[] = []
    
    // 遍历 seatAvailability (后端返回的可用性数据，包含预订信息)
    seatAvailability.value.forEach((seatStatus: any) => {
      // 检查是否有预订信息，并且预订信息中包含用户信息
      if (seatStatus.bookingUserInfo) {
        // 找到对应的 Seat 对象，获取 table 和 seatNumber
        const frontendSeat = seats.value.find(s => s.backendSeatId === seatStatus.seatId)
        
        if (frontendSeat) {
          partners.push({
            // 假设 bookingUserInfo 包含 name 和 id
            id: String(seatStatus.bookingUserInfo.userId), // 使用 userId 作为 id
            name: seatStatus.bookingUserInfo.userName, // 使用 userName 作为 name
            table: frontendSeat.table, // 从前端座位数据获取 table
            seat: frontendSeat.id, // 使用前端 seatNumber (例如 A-01) 作为 seat
          })
        }
      }
    })
    return partners
  })

  // 搜索伙伴
  const searchPartners = (query: string) => {
    if (!query) return bookedPartners.value
    const lowerQuery = query.toLowerCase()
    return bookedPartners.value.filter((p) => p.name.toLowerCase().includes(lowerQuery))
  }

  // 根据桌子获取伙伴 (现在基于 bookedPartners)
  const getPartnersByTable = (table: string) => {
    return bookedPartners.value.filter((p) => p.table === table)
  }

  // 获取某个桌子的所有座位 (用于 FindPartnerModal 渲染)
  const getSeatsForTable = (table: string) => {
    return allTables.value[table] || []
  }

  return {
    allPartners: bookedPartners, // 暴露已预订的伙伴列表
    allTables, // 暴露所有桌子及其座位
    getPartnersByTable,
    getSeatsForTable, // 暴露获取某个桌子所有座位的函数
    searchPartners,
  }
}
