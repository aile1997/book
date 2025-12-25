import { ref, computed } from 'vue'
import { useSeats } from './useSeats'
import { searchUsers } from '../api'
import type { Seat, Partner } from '../types/booking'
import { debounce } from '../utils/debounce'

// 伙伴管理组合式函数
export function usePartners() {
  // 引入 useSeats 来获取 seatAvailability 和 seats
  const { seatAvailability, seats } = useSeats()

  // -----------------------------------------------------------------------------
  // Find Partner 逻辑 (基于已预订座位)
  // -----------------------------------------------------------------------------

  // 计算属性：获取所有存在的桌子及其座位
  const allTables = computed(() => {
    const tables: { [key: string]: Seat[] } = {}
    seats.value.forEach((seat) => {
      const tableId = seat.table as string
      if (!tables[tableId]) {
        tables[tableId] = []
      }
      tables[tableId].push(seat)
    })
    // 对每个桌子的座位进行排序，确保渲染顺序正确
    Object.values(tables).forEach((seatList) => {
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
        const frontendSeat = seats.value.find((s) => s.backendSeatId === seatStatus.seatId)

        if (frontendSeat) {
          partners.push({
            // 假设 bookingUserInfo 包含 name 和 id
            id: String(seatStatus.bookingUserInfo.userId), // 使用 userId 作为 id
            name: seatStatus.bookingUserInfo.fullName || seatStatus.bookingUserInfo.username, // 使用 fullName 或 username
            table: frontendSeat.table, // 从前端座位数据获取 table
            seat: frontendSeat.id, // 使用前端 seatNumber (例如 A-01) 作为 seat
          })
        }
      }
    })
    return partners
  })

  // 搜索伙伴 (Find Partner)
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

  // -----------------------------------------------------------------------------
  // Invite Partner 逻辑 (基于用户搜索)
  // -----------------------------------------------------------------------------

  const searchResults = ref<any[]>([])
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)

  /**
   * 搜索用户 (Invite Partner) - 实际执行函数
   * @param query 搜索关键词
   */
  async function searchUsersForInvite(query: string) {
    if (!query || query.length < 2) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    searchError.value = null
    try {
      // 调用新增的 searchUsers API
      const data = await searchUsers(query, 10) // 限制返回 10 个结果
      searchResults.value = data || []
    } catch (err: any) {
      searchError.value = '搜索用户失败: ' + (err.message || '未知错误')
      console.error(searchError.value, err)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  // 对搜索用户函数进行防抖处理 (延迟 500ms)
  const debouncedSearchUsersForInvite = debounce(searchUsersForInvite, 500)

  return {
    // Find Partner 导出
    allPartners: bookedPartners,
    allTables,
    getPartnersByTable,
    getSeatsForTable,
    searchPartners,

    // Invite Partner 导出
    searchResults,
    isSearching,
    searchError,
    searchUsersForInvite: debouncedSearchUsersForInvite, // 暴露防抖后的函数
  }
}

// 对搜索用户函数进行防抖处理 (延迟 500ms)
const debouncedSearchUsersForInvite = debounce(searchUsersForInvite, 500)
