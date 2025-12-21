import { ref, computed } from 'vue'
import type { Seat, Partner } from '../types/booking'
import { getSeatMap } from '../api' // 导入 API 客户端

// 座位管理组合式函数
export function useSeats() {
  // 所有座位数据 - 动态数据层
  const seats = ref<Seat[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 从后端 API 加载座位平面图数据
   */
  async function loadSeatMap() {
    isLoading.value = true
    error.value = null
    try {
      // 调用 API 获取座位图数据
      const data = await getSeatMap()
      // 假设 API 返回的 data 结构可以直接映射到 Seat[]，或者需要进行转换
      // 这里的逻辑需要根据实际 API 返回结构进行调整。
      // 暂时使用一个简单的转换逻辑，假设 API 返回一个包含 seats 数组的对象
      if (data && data.seats) {
        seats.value = data.seats.map((seat: any) => ({
          id: seat.seatId,
          table: seat.areaId, // 假设 areaId 对应 table
          position: seat.position, // 假设 API 返回 position
          index: seat.index, // 假设 API 返回 index
          status: seat.status, // 假设 API 返回 status: 'available', 'occupied', 'selected'
          occupiedBy: seat.occupiedBy || '',
        }))
      } else {
        // 如果 API 返回的不是预期的结构，使用默认数据（原文件中的数据）
        console.warn('API 返回结构不符合预期，使用默认座位数据。')
        seats.value = [
          // 桌子 A - 左侧座位 (6个)
          { id: 'A1', table: 'A', position: 'left', index: 0, status: 'occupied', occupiedBy: '' },
          { id: 'A2', table: 'A', position: 'left', index: 1, status: 'occupied', occupiedBy: '' },
          { id: 'A3', table: 'A', position: 'left', index: 2, status: 'occupied', occupiedBy: '' },
          { id: 'A4', table: 'A', position: 'left', index: 3, status: 'available' },
          { id: 'A5', table: 'A', position: 'left', index: 4, status: 'available' },
          { id: 'A6', table: 'A', position: 'left', index: 5, status: 'available' },

          // 桌子 A - 右侧座位 (6个)
          { id: 'A7', table: 'A', position: 'right', index: 0, status: 'available' },
          { id: 'A8', table: 'A', position: 'right', index: 1, status: 'occupied', occupiedBy: '' },
          { id: 'A9', table: 'A', position: 'right', index: 2, status: 'available' },
          { id: 'A10', table: 'A', position: 'right', index: 3, status: 'available' },
          { id: 'A11', table: 'A', position: 'right', index: 4, status: 'available' },
          { id: 'A12', table: 'A', position: 'right', index: 5, status: 'occupied', occupiedBy: '' },

          // 桌子 B - 左侧座位 (3个 - 上半部分)
          { id: 'B1', table: 'B', position: 'left', index: 0, status: 'available' },
          { id: 'B2', table: 'B', position: 'left', index: 1, status: 'occupied', occupiedBy: '' },
          { id: 'B3', table: 'B', position: 'left', index: 2, status: 'occupied', occupiedBy: '' },

          // 桌子 B - 右侧座位 (3个 - 上半部分)
          { id: 'B4', table: 'B', position: 'right', index: 0, status: 'available' },
          { id: 'B5', table: 'B', position: 'right', index: 1, status: 'available' },
          { id: 'B6', table: 'B', position: 'right', index: 2, status: 'available' },

          // 桌子 C - 左侧座位 (3个 - 下半部分)
          {
            id: 'C1',
            table: 'C',
            position: 'left',
            index: 0,
            status: 'occupied',
            occupiedBy: 'Ethan Wei',
          },
          { id: 'C2', table: 'C', position: 'left', index: 1, status: 'occupied', occupiedBy: '' },
          { id: 'C3', table: 'C', position: 'left', index: 2, status: 'occupied', occupiedBy: '' },

          // 桌子 C - 右侧座位 (3个 - 下半部分)
          { id: 'C4', table: 'C', position: 'right', index: 0, status: 'available' },
          { id: 'C5', table: 'C', position: 'right', index: 1, status: 'available' },
          { id: 'C6', table: 'C', position: 'right', index: 2, status: 'available' },
        ]
      }
    } catch (err: any) {
      error.value = '加载座位图失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      // 失败时也使用默认数据，以防界面崩溃
      seats.value = [
        // 桌子 A - 左侧座位 (6个)
        { id: 'A1', table: 'A', position: 'left', index: 0, status: 'occupied', occupiedBy: '' },
        { id: 'A2', table: 'A', position: 'left', index: 1, status: 'occupied', occupiedBy: '' },
        { id: 'A3', table: 'A', position: 'left', index: 2, status: 'occupied', occupiedBy: '' },
        { id: 'A4', table: 'A', position: 'left', index: 3, status: 'available' },
        { id: 'A5', table: 'A', position: 'left', index: 4, status: 'available' },
        { id: 'A6', table: 'A', position: 'left', index: 5, status: 'available' },

        // 桌子 A - 右侧座位 (6个)
        { id: 'A7', table: 'A', position: 'right', index: 0, status: 'available' },
        { id: 'A8', table: 'A', position: 'right', index: 1, status: 'occupied', occupiedBy: '' },
        { id: 'A9', table: 'A', position: 'right', index: 2, status: 'available' },
        { id: 'A10', table: 'A', position: 'right', index: 3, status: 'available' },
        { id: 'A11', table: 'A', position: 'right', index: 4, status: 'available' },
        { id: 'A12', table: 'A', position: 'right', index: 5, status: 'occupied', occupiedBy: '' },

        // 桌子 B - 左侧座位 (3个 - 上半部分)
        { id: 'B1', table: 'B', position: 'left', index: 0, status: 'available' },
        { id: 'B2', table: 'B', position: 'left', index: 1, status: 'occupied', occupiedBy: '' },
        { id: 'B3', table: 'B', position: 'left', index: 2, status: 'occupied', occupiedBy: '' },

        // 桌子 B - 右侧座位 (3个 - 上半部分)
        { id: 'B4', table: 'B', position: 'right', index: 0, status: 'available' },
        { id: 'B5', table: 'B', position: 'right', index: 1, status: 'available' },
        { id: 'B6', table: 'B', position: 'right', index: 2, status: 'available' },

        // 桌子 C - 左侧座位 (3个 - 下半部分)
        {
          id: 'C1',
          table: 'C',
          position: 'left',
          index: 0,
          status: 'occupied',
          occupiedBy: 'Ethan Wei',
        },
        { id: 'C2', table: 'C', position: 'left', index: 1, status: 'occupied', occupiedBy: '' },
        { id: 'C3', table: 'C', position: 'left', index: 2, status: 'occupied', occupiedBy: '' },

        // 桌子 C - 右侧座位 (3个 - 下半部分)
        { id: 'C4', table: 'C', position: 'right', index: 0, status: 'available' },
        { id: 'C5', table: 'C', position: 'right', index: 1, status: 'available' },
        { id: 'C6', table: 'C', position: 'right', index: 2, status: 'available' },
      ]
    } finally {
      isLoading.value = false
    }
  }

  // 首次加载时调用
  if (seats.value.length === 0) {
    loadSeatMap()
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

  return {
    seats,
    selectedSeat,
    availableSeatsCount,
    isLoading,
    error,
    loadSeatMap, // 暴露加载函数
    getSeatsByTable,
    selectSeat,
    clearSelection,
    getSeatColor,
  }
}

// 伙伴管理组合式函数
export function usePartners() {
  // 伙伴数据暂时保留为本地模拟数据，因为 API 文档中没有直接获取所有伙伴的接口
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
  const getPartnersByTable = (table: 'A' | 'B' | 'C') => {
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
