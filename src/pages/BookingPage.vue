<script setup lang="ts">
import NProgress from 'nprogress'
import { ref, computed, onMounted } from 'vue'
import { useBooking } from '../composables/useBooking' // 导入 useBooking
import { useAuth } from '../composables/useAuth' // 导入 useAuth 检查登录状态
import { useRouter } from 'vue-router'
import { useSeats } from '../composables/useSeats'
import { useToast } from '../composables/useToast'
import { checkUserExists } from '../api'
import SeatMap from '../components/features/SeatMap.vue'
import InvitePartnerModal from '../components/modals/InvitePartnerModal.vue'
import FindPartnerModal from '../components/modals/FindPartnerModal.vue'
import SeatSelectionModal from '../components/modals/SeatSelectionModal.vue'
import SuccessModal from '../components/modals/SuccessModal.vue'
import ConfirmModal from '../components/modals/ConfirmModal.vue'
import BookingHistoryModal from '../components/modals/BookingHistoryModal.vue'
import { formatDateISO, isBookingExpired } from '../utils/time'
import { debounce } from '../utils/debounce'
import { parseApiError } from '../utils/errorHandler'
import type {
  TimeSlot,
  Partner,
  SelectedTimeSlot,
  TimeSlotBackend,
  BatchAvailabilityItem,
  Booking,
} from '../types/booking'
import { MAX_TIME_SLOT_SELECTION } from '../types/booking'
import { getMyBookings, cancelBooking as cancelBookingAPI } from '../api'

const router = useRouter()
const { error: showError, success: showSuccess } = useToast()

// 使用座位管理组合式函数
const {
  areas,
  seats,
  // batchAvailabilityData - 不需要从 composable 导出，我们使用局部计算属性
  selectedSeat,
  selectSeat,
  clearSelection,
  isLoading: isLoadingSeats,
  loadTimeSlots, // 导入 loadTimeSlots
  loadAreasWithCache, // 加载区域（带缓存）
  loadSeatMapWithCache, // 加载座位图（带缓存）
  queryBatchSeatAvailability, // 导入批量查询座位可用性
} = useSeats()

// ========== 双层数据管理架构 ==========

/**
 * 解决方案：使用两个独立的 ref 分别存储全时段数据和选中时段数据
 *
 * 数据流：
 * 1. 页面加载 → queryAllTimeSlotsAvailability() → allTimeSlotsAvailability（全时段数据）
 * 2. 用户勾选时段 → executeBatchSeatAvailabilityQuery() → selectedTimeSlotsAvailability（选中时段数据）
 * 3. batchAvailabilityData 计算属性 → 智能组合两者
 */

// 1. 全时段可用性缓存（页面加载时查询，保持不变）
const allTimeSlotsAvailability = ref<BatchAvailabilityItem[]>([])

// 2. 选中时段可用性（用户勾选时实时更新）
const selectedTimeSlotsAvailability = ref<BatchAvailabilityItem[]>([])

// 3. 创建计算属性：智能组合两者
// 这样所有使用 batchAvailabilityData 的代码都能无缝工作
const batchAvailabilityData = computed<BatchAvailabilityItem[]>(() => {
  // 策略：优先使用 selectedTimeSlotsAvailability（用户勾选时的最新数据）
  // 如果为空（用户还没勾选任何时段），回退到 allTimeSlotsAvailability（页面加载时的初始数据）
  return selectedTimeSlotsAvailability.value.length > 0
    ? selectedTimeSlotsAvailability.value
    : allTimeSlotsAvailability.value
})

// 使用预订管理组合式函数
const { makeBooking, changeSeat, isLoading: isBookingLoading, removeBooking } = useBooking()

// 使用认证组合式函数
const { isAuthenticated } = useAuth()

// ========== 状态管理 ==========

// 邀请的伙伴列表
const invitedPartners = ref<Partner[]>([])

// Coins 消耗
const coinCost = ref(5)

// 模态框状态
const showSeatModal = ref(false)
const showFindPartnerModal = ref(false)
const showSuccessModal = ref(false)
const showConfirmModal = ref(false)
const showBookingHistoryModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  onConfirm: () => {},
})

// 高亮显示的伙伴（用于在座位图上显示tooltip）
const highlightedPartner = ref<{ name: string; seat: string } | null>(null)

// ========== 多时段选择状态 ==========

// 选中的时段列表（支持多选）
const selectedTimeSlots = ref<SelectedTimeSlot[]>([])
const maxTimeSlotSelection = MAX_TIME_SLOT_SELECTION

// 检查是否可以继续选择时段
const canSelectMoreTimeSlots = computed(() => {
  return selectedTimeSlots.value.length < maxTimeSlotSelection
})

// 获取已选时段数量
const selectedTimeSlotCount = computed(() => {
  return selectedTimeSlots.value.length
})

// ========== 我的预订历史状态 ==========

const bookingHistory = ref<Booking[]>([])
const isLoadingHistory = ref(false)

// 加载预订历史
const loadBookingHistory = async () => {
  isLoadingHistory.value = true
  try {
    const response = await getMyBookings({ skip: 0, limit: 20 })
    bookingHistory.value = response.bookings || response.data?.bookings || []
  } catch (error) {
    const errorMessage = parseApiError(error)
    console.error('加载预订历史失败:', errorMessage)
    // 静默失败，不阻塞用户操作（预订历史是次要功能）
  } finally {
    isLoadingHistory.value = false
  }
}

// 取消预订
const cancelBookingById = async (bookingId: number) => {
  try {
    await cancelBookingAPI(bookingId)
    showSuccess('预订已取消')
    showBookingHistoryModal.value = false // 关闭弹框
    await loadBookingHistory() // 刷新列表
    await refreshData() // 刷新座位可用性
  } catch (error) {
    const errorMessage = parseApiError(error)
    showError(errorMessage || '取消预订失败')
  }
}

// 打开预订历史弹框
const openBookingHistory = async () => {
  showBookingHistoryModal.value = true
  // 刷新预订历史数据
  await loadBookingHistory()
}

// ========== 时间段数据 ==========

// 辅助函数：格式化日期为 11.20 这种格式
const formatDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}.${day}`
}

// 辅助函数：获取星期缩写
const getWeekday = (date: Date) => {
  const weekdays = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
  return weekdays[date.getDay()]
}

// 计算当前时间段是否有我的预订（在所有选定时段中）
const myBookingInCurrentSlot = computed(() => {
  // 只有当用户在所有选定的时段都预订了同一个座位时，才认为当前有预订
  // 这符合"单座位+多时段"的逻辑
  return seats.value.find((s) => s.bookedByMe)
})

// 获取今天和明天的 Date 对象，使用计算属性确保始终是最新的
const today = computed(() => new Date())
const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date
})

const timeSlots = ref<TimeSlot[]>([]) // 初始为空，等待加载

// 辅助函数：将后端时间段数据适配到前端 TimeSlot 结构
// 辅助函数：将后端时间段数据适配到前端 TimeSlot 结构
const adaptTimeSlots = (backendSlots: TimeSlotBackend[]) => {
  // 映射后的中间类型（添加 id、time、rawEndTime 字段）
  interface AdaptedTimeSlot {
    id: string
    time: string
    rawEndTime: string
  }

  // 基础映射（不包含 isExpiredToday，因为需要针对不同日期单独计算）
  const backendTimeSlots = backendSlots.map((slot: TimeSlotBackend): AdaptedTimeSlot => {
    return {
      id: String(slot.id), // 确保是字符串
      time: `${slot.startTime} - ${slot.endTime}`,
      rawEndTime: slot.endTime, // 保留原始结束时间
    }
  })

  // 模拟两天的 TimeSlot 结构
  timeSlots.value = [
    {
      id: '1',
      date: formatDate(today.value),
      weekday: getWeekday(today.value),
      dateISO: formatDateISO(today.value),
      times: backendTimeSlots.map((slot: AdaptedTimeSlot) => {
        // ✅ 为今天的时段单独计算 isExpiredToday
        const isExpiredToday = isBookingExpired(
          formatDateISO(today.value),
          slot.time.split(' - ')[0],
        )
        return {
          ...slot,
          selected: false,
          disabled: isExpiredToday, // 今天已过期的时间段禁用
          isExpiredToday, // 标记今天的时间段是否已过期
        }
      }),
    },
    {
      id: '2',
      date: formatDate(tomorrow.value),
      weekday: getWeekday(tomorrow.value),
      dateISO: formatDateISO(tomorrow.value),
      times: backendTimeSlots.map((slot: AdaptedTimeSlot) => {
        // ✅ 为明天的时段单独计算 isExpiredToday
        const isExpiredToday = isBookingExpired(
          formatDateISO(tomorrow.value),
          slot.time.split(' - ')[0],
        )
        return {
          ...slot,
          selected: false,
          disabled: false, // 明天的时间段初始不禁用（后续根据实际可用性更新）
          isExpiredToday, // 明天的时段通常应该是 false（除非明天已经过去了）
        }
      }),
    },
  ]
}

// 在 onMounted 中调用 loadTimeSlots 并适配数据
onMounted(async () => {
  // 此时路由守卫已经触发了 NProgress.start()
  try {
    // 0. 清除上一次的选择状态
    clearSelection()

    // 1. 并发加载基础数据（缓存逻辑）
    if (seats.value.length === 0) {
      await Promise.all([loadAreasWithCache(), loadSeatMapWithCache()])
    }

    // 2. 加载时间段数据
    const backendSlots = await loadTimeSlots()
    if (backendSlots && backendSlots.length > 0) {
      adaptTimeSlots(backendSlots)
    }

    // 2.5 加载预订历史
    await loadBookingHistory()

    // --- 新增：解析路由参数并自动选中 ---
    const targetDate = router.currentRoute.value.query.date as string
    const targetSlotId = router.currentRoute.value.query.slotId as string

    if (timeSlots.value.length > 0) {
      let found = false

      // 如果有传入参数，尝试匹配并添加到多选列表
      if (targetDate && targetSlotId) {
        timeSlots.value.forEach((dateSlot) => {
          if (dateSlot.dateISO === targetDate) {
            const timeSlot = dateSlot.times.find((t) => t.id === targetSlotId)
            if (timeSlot && !timeSlot.disabled) {
              timeSlot.selected = true
              // 添加到多选列表
              const key = `${dateSlot.dateISO}_${timeSlot.id}`
              selectedTimeSlots.value.push({
                key,
                dateISO: dateSlot.dateISO,
                date: dateSlot.date,
                weekday: dateSlot.weekday,
                timeSlotId: timeSlot.id,
                time: timeSlot.time,
                isExpired: timeSlot.disabled || false,
              })
              found = true
            }
          }
        })
      }

      // 如果没传参数或匹配失败，执行原有的"选中第一个可用"逻辑
      if (!found) {
        for (const dateSlot of timeSlots.value) {
          const firstAvailable = dateSlot.times.find((time) => !time.disabled)
          if (firstAvailable) {
            firstAvailable.selected = true
            // 添加到多选列表
            const key = `${dateSlot.dateISO}_${firstAvailable.id}`
            selectedTimeSlots.value.push({
              key,
              dateISO: dateSlot.dateISO,
              date: dateSlot.date,
              weekday: dateSlot.weekday,
              timeSlotId: firstAvailable.id,
              time: firstAvailable.time,
              isExpired: firstAvailable.disabled || false,
            })
            break
          }
        }
      }

      // 如果有选中的时段，触发批量查询
      if (selectedTimeSlots.value.length > 0) {
        await executeBatchSeatAvailabilityQuery()
      }

      // ✨ 新增：初始加载时查询所有时段的座位可用性
      // 这样用户在勾选其他时段前，就能看到准确的座位状态
      // await queryAllTimeSlotsAvailability()
    }

    // // 3. 业务逻辑处理：默认选中并查询可用性
    // if (timeSlots.value.length > 0) {
    //   let firstAvailableTimeSlot = null
    //   for (const dateSlot of timeSlots.value) {
    //     firstAvailableTimeSlot = dateSlot.times.find((time) => !time.disabled)
    //     if (firstAvailableTimeSlot) {
    //       firstAvailableTimeSlot.selected = true
    //       break
    //     }
    //   }

    //   if (selectedDateTime.value) {
    //     // 等待关键的可用性查询完成
    //     await querySeatAvailability(
    //       selectedDateTime.value.dateISO,
    //       Number(selectedDateTime.value.timeSlotId),
    //     )
    //   }
    // }
  } catch (error) {
    console.error('页面数据初始化失败:', error)
  } finally {
    NProgress.done()
  }
})

// 选中的时间段
const selectedDateTime = computed(() => {
  for (const slot of timeSlots.value) {
    const selectedTime = slot.times.find((t) => t.selected)
    if (selectedTime) {
      return {
        date: slot.date,
        weekday: slot.weekday,
        dateISO: slot.dateISO,
        time: selectedTime.time,
        timeSlotId: selectedTime.id, // 使用 timeSlotId 0 或 1
      }
    }
  }
  return null
})

// 切换时间段选择（支持多选）
const toggleTimeSlot = async (dateIndex: number, timeIndex: number) => {
  const slot = timeSlots.value[dateIndex].times[timeIndex]
  const key = `${timeSlots.value[dateIndex].dateISO}_${slot.id}`

  const existingIndex = selectedTimeSlots.value.findIndex((s) => s.key === key)

  if (existingIndex > -1) {
    // 已选中，取消选择
    selectedTimeSlots.value.splice(existingIndex, 1)
    slot.selected = false
  } else {
    // 未选中，检查是否达到上限
    if (!canSelectMoreTimeSlots.value) {
      showError(`最多只能选择 ${maxTimeSlotSelection} 个时段`)
      return
    }
    // 添加到选择列表
    selectedTimeSlots.value.push({
      key,
      dateISO: timeSlots.value[dateIndex].dateISO,
      date: timeSlots.value[dateIndex].date,
      weekday: timeSlots.value[dateIndex].weekday,
      timeSlotId: slot.id,
      time: slot.time,
      isExpired: slot.disabled || false,
    })
    slot.selected = true
  }

  // 触发批量可用性查询（使用防抖）
  if (selectedTimeSlots.value.length > 0) {
    debouncedBatchQuery()
  } else {
    // 如果没有选中任何时段，重置所有状态
    clearSelection()
    // 将所有座位重置为可用状态，并清除预订信息
    seats.value.forEach((seat) => {
      seat.status = 'available'
      seat.occupiedBy = ''
      // 清除动态添加的预订字段
      seat.bookedByMe = undefined
      seat.bookingId = null
    })
    // 重置所有非过期时间段的 disabled 状态
    // timeSlots.value.forEach((dateSlot) => {
    //   dateSlot.times.forEach((time) => {
    //     time.disabled = time.isExpiredToday || false
    //   })
    // })
  }
}

// 创建防抖版本的批量查询函数（100ms 延迟）
const debouncedBatchQuery = debounce(() => {
  executeBatchSeatAvailabilityQuery()
}, 0)

/**
 * 根据批量数据更新时间段置灰状态
 * @param targetSeatBackendId - 目标座位的后端 ID（用于检查可用性）
 *
 * 业务逻辑：
 * - 遍历所有前端显示的时段
 * - 对于 batchAvailabilityData 中存在的时段：根据实际可用性设置 disabled
 * - 对于 batchAvailabilityData 中不存在的时段：保持原状态（理论上不应该发生，因为页面加载时已查询所有时段）
 * - 已选中的时段和过期时段不受影响
 *
 * 数据流说明（双层数据管理架构）：
 * 1. 页面初始加载 → queryAllTimeSlotsAvailability() → allTimeSlotsAvailability 存储所有时段数据
 * 2. batchAvailabilityData 计算属性 → 返回 allTimeSlotsAvailability（因为 selectedTimeSlotsAvailability 为空）
 * 3. 用户选中座位 A1 → 调用此函数 → 从 batchAvailabilityData 读取 A1 在所有时段的可用性
 * 4. 用户勾选新时段 → executeBatchSeatAvailabilityQuery() → selectedTimeSlotsAvailability 更新
 * 5. batchAvailabilityData 计算属性 → 自动切换到 selectedTimeSlotsAvailability（优先级更高）
 *
 * ✅ 优化后的优势：
 * - 页面加载时已查询所有时段，batchAvailabilityData 通过计算属性智能切换数据源
 * - 用户选中座位后，能立即看到该座位在所有时段的可用性状态
 * - 不会出现"未选时段数据缺失"的问题
 * - 用户勾选时段时，仍能获取最新数据（数据新鲜度）
 */
const updateTimeSlotsDisabledState = (targetSeatBackendId?: number) => {
  if (!targetSeatBackendId || !batchAvailabilityData.value) return

  // 构建快速查找映射：key = bookingDate_timeSlotId, value = seats数组
  const availabilityMap = new Map<string, BatchAvailabilityItem['seats']>()
  batchAvailabilityData.value.forEach((slot) => {
    const key = `${slot.bookingDate}_${slot.timeSlotId}`
    availabilityMap.set(key, slot.seats)
  })

  // 遍历所有前端显示的日期和时段
  timeSlots.value.forEach((dateSlot) => {
    dateSlot.times.forEach((time) => {
      // 跳过已选中的时段和过期时段（不受影响）
      if (time.selected || time.isExpiredToday) return

      // 构建查找 key
      const lookupKey = `${dateSlot.dateISO}_${time.id}`
      const seatsInSlot = availabilityMap.get(lookupKey)

      if (seatsInSlot) {
        // ✅ 找到了该时段的座位数据：检查目标座位是否可用
        const targetSeat = seatsInSlot.find((s) => s.seatId === targetSeatBackendId)
        if (targetSeat) {
          // 找到了目标座位：根据可用性设置置灰状态
          time.disabled = !targetSeat.isAvailable
        } else {
          // 座位 ID 不在该时段的座位列表中（可能座位配置不同）
          // 保持原状态不变
        }
      } else {
        // ❌ 未找到该时段的数据（理论上不应该发生）
        // 因为页面加载时已经查询了所有时段的座位可用性
        // 如果进入此分支，说明：
        // 1. queryAllTimeSlotsAvailability 调用失败
        // 2. 或者时段数据结构不匹配
        console.warn(`未找到时段 ${lookupKey} 的座位可用性数据，保持原状态`)
        // 保持原 disabled 状态不变
      }
    })
  })
}

// 批量查询座位可用性（用户勾选时段时调用）
const executeBatchSeatAvailabilityQuery = async () => {
  if (selectedTimeSlots.value.length === 0) return

  // 构建批量查询参数
  const queryParams = selectedTimeSlots.value.map((slot) => ({
    areaId: areas.value[0]?.id,
    bookingDate: slot.dateISO,
    timeSlotId: Number(slot.timeSlotId),
  }))

  // 记录当前选中的座位信息，用于后续检查
  const currentlySelectedSeatId = selectedSeat.value
  const currentlySelectedSeatObj = currentlySelectedSeatId
    ? seats.value.find((s) => s.id === currentlySelectedSeatId)
    : null

  try {
    // 调用 composable 中的批量查询函数
    // 这个函数会更新 seatAvailability.value，供 FindPartnerModal 使用
    // 同时也会调用 updateSeatsStatus 更新 seats 状态
    const data = await queryBatchSeatAvailability(queryParams)

    // ✅ 最小改动：检查当前选中的座位在新勾选时段是否可用
    if (currentlySelectedSeatObj && data && Array.isArray(data)) {
      // 遍历查询结果，找出不可用的时段
      const unavailableSlots: Array<{ date: string; time: string; key: string }> = []

      data.forEach((slotData) => {
        // 查找当前选中座位在该时段的可用性
        const seatInSlot = slotData.seats?.find(
          (s) => s.seatId === currentlySelectedSeatObj.backendSeatId,
        )

        // 如果座位在该时段不可用，记录该时段信息
        if (seatInSlot && !seatInSlot.isAvailable) {
          const slotInfo = selectedTimeSlots.value.find(
            (s) =>
              s.dateISO === slotData.bookingDate && s.timeSlotId === String(slotData.timeSlotId),
          )

          if (slotInfo) {
            unavailableSlots.push({
              date: slotInfo.date,
              time: slotInfo.time,
              key: slotInfo.key,
            })
          }
        }
      })

      // 如果有不可用的时段，显示提示并还原选中状态
      if (unavailableSlots.length > 0) {
        const slotDetails = unavailableSlots.map((s) => `${s.date} ${s.time}`).join('、')
        showError(
          `${currentlySelectedSeatObj.id} 座位在以下时段已被占用：\n${slotDetails}\n\n请选择其它时间段或重新选择座位`,
        )

        // 还原选中状态：移除不可用时段
        unavailableSlots.forEach((slot) => {
          const index = selectedTimeSlots.value.findIndex((s) => s.key === slot.key)
          if (index > -1) {
            selectedTimeSlots.value.splice(index, 1)
          }
          // 同步更新 timeSlots 中的 selected 状态
          timeSlots.value.forEach((dateSlot) => {
            const timeSlot = dateSlot.times.find(
              (t) => t.selected && `${dateSlot.dateISO}_${t.id}` === slot.key,
            )
            if (timeSlot) timeSlot.selected = false
          })
        })

        // 如果还有选中时段，重新查询；否则重置状态
        if (selectedTimeSlots.value.length > 0) {
          await executeBatchSeatAvailabilityQuery()
        } else {
          clearSelection()
          selectedTimeSlotsAvailability.value = []
        }
        return
      }
    }

    // ✅ 关键修改：存储到 selectedTimeSlotsAvailability（触发计算属性优先级逻辑）
    if (data && Array.isArray(data)) {
      selectedTimeSlotsAvailability.value = data
      console.log('选中时段查询成功，数据已存储到 selectedTimeSlotsAvailability')
    }

    // 使用提取的公共函数更新时段置灰状态
    if (selectedSeat.value) {
      const selectedSeatObj = seats.value.find((s) => s.id === selectedSeat.value)
      if (selectedSeatObj) {
        // updateTimeSlotsDisabledState(selectedSeatObj.backendSeatId)
      }
    }
  } catch (error) {
    const errorMessage = parseApiError(error)
    console.error('批量查询座位可用性失败:', errorMessage)
    showError(errorMessage || '查询座位可用性失败，请稍后重试')
  }
}

/**
 * 查询所有时段的座位可用性（页面初始加载时调用）
 *
 * 业务逻辑：
 * - 遍历 timeSlots 中**所有时段**（包括已过期时段）
 * - 构建批量查询参数，一次性获取所有时段的座位可用性
 * - 将结果存储到 allTimeSlotsAvailability（全时段缓存）
 *
 * 优势：
 * - 用户进入页面就能看到准确的座位状态（包括已过期时段的座位状态）
 * - 后续勾选时段时，可以直接从 allTimeSlotsAvailability 读取数据
 * - 保持数据新鲜度：用户勾选时段时仍会重新查询最新数据（存储到 selectedTimeSlotsAvailability）
 *
 * 注意：即使时段已过期，仍然查询其座位可用性，以便用户了解座位的使用情况
 */
const queryAllTimeSlotsAvailability = async () => {
  if (!areas.value || areas.value.length === 0) {
    console.warn('区域数据未加载，跳过全时段查询')
    return
  }

  // 收集**所有时段**的查询参数（包括已过期时段）
  const allQueries: Array<{
    areaId: number
    bookingDate: string
    timeSlotId: number
  }> = []

  timeSlots.value.forEach((dateSlot) => {
    dateSlot.times.forEach((time) => {
      // ✅ 修改：查询所有时段，不管是否过期
      allQueries.push({
        areaId: areas.value[0].id,
        bookingDate: dateSlot.dateISO,
        timeSlotId: Number(time.id),
      })
    })
  })

  if (allQueries.length === 0) {
    console.warn('没有可查询的时段')
    return
  }

  try {
    console.log('初始加载：查询所有时段的座位可用性，时段数量:', allQueries.length)
    const data = await queryBatchSeatAvailability(allQueries)

    if (data && Array.isArray(data)) {
      console.log('所有时段查询成功，数据已存储到 allTimeSlotsAvailability')
      // 存储到全时段缓存（不触发计算属性的优先级逻辑）
      allTimeSlotsAvailability.value = data
    }
  } catch (error) {
    const errorMessage = parseApiError(error)
    console.error('查询所有时段座位可用性失败:', errorMessage)
    // 静默失败，不阻塞用户操作（用户仍可手动勾选时段触发查询）
  }
}

// ========== 事件处理函数 ==========

// 打开座位选择模态框
const openSeatModal = () => {
  showSeatModal.value = true
}

// 选择座位（从模态框）
const handleSeatSelect = (seatId: string) => {
  selectSeat(seatId)
  // 保持模态框开启，支持用户换座
  // showSeatModal.value = false
}

// 确认座位选择
const confirmSeatSelection = () => {
  showSeatModal.value = false
  highlightedPartner.value = null

  // 确认座位后，立即更新其他时段的置灰状态
  // 检查当前选中的座位在其他时段是否可用
  if (selectedSeat.value && batchAvailabilityData.value) {
    const selectedSeatObj = seats.value.find((s) => s.id === selectedSeat.value)
    if (selectedSeatObj) {
      // updateTimeSlotsDisabledState(selectedSeatObj.backendSeatId)
    }
  }
}

// 重新选择座位

// 移除邀请伙伴
const removePartner = (partner: Partner) => {
  invitedPartners.value = invitedPartners.value.filter((p) => p.id !== partner.id)
}

// 打开查找伙伴模态框（从座位选择模态框）
const openFindPartnerFromSeatModal = () => {
  showFindPartnerModal.value = true
}

// 打开查找伙伴模态框
const openFindPartnerModal = () => {
  showFindPartnerModal.value = true
}

// 确认邀请伙伴
const confirmPartnerInvite = () => {
  showFindPartnerModal.value = false
}

// 处理伙伴选择（用于高亮显示）
const handlePartnerSelect = (partner: Partner) => {
  if (partner.seat) {
    highlightedPartner.value = {
      name: partner.fullName,
      seat: partner.seat,
    }
  }
  showFindPartnerModal.value = false
}

// 清除高亮
const clearHighlight = () => {
  highlightedPartner.value = null
}

// --- 邻座分配逻辑 ---
const assignNearbySeats = (mySeatId: string, partnersCount: number) => {
  console.log(mySeatId)

  if (!mySeatId || partnersCount <= 0) return []

  const table = mySeatId.charAt(0) // 获取桌号，如 'A'
  const myNum = parseInt(mySeatId.substring(1)) // 获取座位数字，如 6

  // 筛选同桌的其他空位
  const availableSeatsOnSameTable = seats.value.filter(
    (s) => s.table === table && s.status === 'available' && s.id !== mySeatId,
  )

  // 排序规则：计算与我的座位数字距离最近的位子 (曼哈顿距离)
  return availableSeatsOnSameTable
    .sort((a, b) => {
      const distA = Math.abs(parseInt(a.id.substring(1)) - myNum)
      const distB = Math.abs(parseInt(b.id.substring(1)) - myNum)
      return distA - distB
    })
    .slice(0, partnersCount)
    .map((s) => s.id)
}

/**
 * 预订执行核心逻辑（支持多时段）
 * 涵盖四种场景：切换座位、直接邀请好友、正常选座、正常选座邀请
 */
const bookNow = async () => {
  // 基础校验：登录状态与时间段选择
  if (!isAuthenticated.value) return showError('请先登录才能进行预订操作')
  if (selectedTimeSlots.value.length === 0) return showError('请先选择至少一个预订时间段')

  // 1. 确定目标座位
  const targetSeat = selectedSeat.value
    ? seats.value.find((s) => s.id === selectedSeat.value)
    : myBookingInCurrentSlot.value

  if (!targetSeat?.backendSeatId) return showError('请先选择有效的座位')

  // 2. 伙伴预订状态校验（需要检查所有选定时段）
  if (invitedPartners.value.length > 0) {
    try {
      const checkPromises = invitedPartners.value.flatMap((partner) =>
        selectedTimeSlots.value.map((slot) =>
          checkUserExists({
            feishuUserId: partner.id,
            bookingDate: slot.dateISO,
            timeSlotId: Number(slot.timeSlotId),
            areaId: areas.value.length > 0 ? areas.value[0].id : undefined,
          }).then((exists) => ({
            partner,
            slot,
            exists,
          })),
        ),
      )

      const results = await Promise.all(checkPromises)
      const conflicts = results.filter((r) => r.exists)

      if (conflicts.length > 0) {
        const details = conflicts
          .map((c) => `${c.partner.fullName} (${c.slot.date} ${c.slot.time})`)
          .join('\n')
        return showError(`以下伙伴在相应时段已有预订：\n${details}`)
      }
    } catch (err) {
      const errorMessage = parseApiError(err)
      console.error('校验伙伴状态失败:', errorMessage)
      // 伙伴状态校验失败，阻止继续预订
      return showError(errorMessage || '校验伙伴状态失败，请稍后重试')
    }
  }

  // 3. 准备伙伴邀请数据
  const invitePartners = invitedPartners.value
    .map((partner) => {
      const assignedSeat = seats.value.find((s) => s.id === assignNearbySeats(targetSeat.id, 1)[0])
      return assignedSeat?.backendSeatId
        ? {
            userId: String(partner.id),
            openId: partner.openId || '',
            username: partner.username || partner.fullName,
            seatId: assignedSeat.backendSeatId,
          }
        : null
    })
    .filter((p) => p !== null)

  /**
   * 成功后的清理与刷新逻辑
   *
   * 业务逻辑：
   * 1. 显示成功弹窗
   * 2. 刷新预订历史
   * 3. 清空座位选择和伙伴邀请
   * 4. 重置时段选择状态
   * 5. 自动选择第一个可用时段并刷新可用性
   */
  const handleSuccess = async () => {
    showSuccessModal.value = true
    await loadBookingHistory()

    // 保存当前预订的座位后端ID，用于后续置灰逻辑
    const bookedSeatBackendId = seats.value.find((s) => s.id === selectedSeat.value)?.backendSeatId

    clearSelection()
    invitedPartners.value = []

    // 重置所有时段选择状态
    timeSlots.value.forEach((slot) => {
      slot.times.forEach((time) => {
        time.selected = false
        // 只保留过期时段的禁用状态，其他时段重置为可用
        time.disabled = time.isExpiredToday || false
      })
    })
    selectedTimeSlots.value = []

    // ✅ 关键修改：重置 selectedTimeSlotsAvailability（回到使用全时段数据）
    selectedTimeSlotsAvailability.value = []
    console.log('预订成功：重置 selectedTimeSlotsAvailability，回退到全时段数据')

    // 自动选择第一个可用时段（提升用户体验）
    for (const dateSlot of timeSlots.value) {
      const firstAvailable = dateSlot.times.find((time) => !time.disabled)
      if (firstAvailable) {
        firstAvailable.selected = true
        selectedTimeSlots.value.push({
          key: `${dateSlot.dateISO}_${firstAvailable.id}`,
          dateISO: dateSlot.dateISO,
          date: dateSlot.date,
          weekday: dateSlot.weekday,
          timeSlotId: firstAvailable.id,
          time: firstAvailable.time,
          isExpired: firstAvailable.disabled || false,
        })
        break
      }
    }

    // 执行批量查询，获取最新的座位可用性数据
    if (selectedTimeSlots.value.length > 0) {
      const data = await queryBatchSeatAvailability(
        selectedTimeSlots.value.map((slot) => ({
          areaId: areas.value[0]?.id,
          bookingDate: slot.dateISO,
          timeSlotId: Number(slot.timeSlotId),
        })),
      )

      // ✅ 更新 selectedTimeSlotsAvailability（新的默认选中时段）
      if (data && Array.isArray(data)) {
        selectedTimeSlotsAvailability.value = data
      }

      // 使用提取的公共函数更新时段置灰状态
      // 注意：此时没有选中座位，所以不传入参数
      // 这里实际上不需要置灰，因为没有选中任何座位
      // 但为了代码一致性，保留调用
      if (bookedSeatBackendId) {
        // updateTimeSlotsDisabledState(bookedSeatBackendId)
      }
    }
  }

  // 4. 场景判断与执行
  const isChangingSeat = !!selectedSeat.value && !!myBookingInCurrentSlot.value
  const isInvitingOnly =
    !selectedSeat.value && !!myBookingInCurrentSlot.value && invitedPartners.value.length > 0

  if (isChangingSeat) {
    // 场景 1：切换座位 -> 调用 swap-seat 接口
    confirmModalConfig.value = {
      title: 'Change Seat',
      message:
        'You already have a booking. Do you want to change your seat for all selected time slots?',
      onConfirm: async () => {
        // 空值检查：确保 myBookingInCurrentSlot 存在且 bookingId 有效
        const currentBooking = myBookingInCurrentSlot.value
        if (!currentBooking) {
          showError('未找到当前预订，请刷新页面重试')
          return
        }

        const bookingId = currentBooking.bookingId
        if (!bookingId) {
          showError('预订 ID 无效，请刷新页面重试')
          return
        }

        try {
          await changeSeat({
            bookingId,
            newSeatId: targetSeat.backendSeatId,
            invitePartners,
          })
          await handleSuccess()
        } catch (error) {
          const errorMessage = parseApiError(error)
          showError(errorMessage || '换座失败')
        }
      },
    }
    showConfirmModal.value = true
  } else if (isInvitingOnly) {
    // 场景 2：直接邀请好友 -> 调用 swap-seat 接口（座位 ID 不变）
    confirmModalConfig.value = {
      title: 'Invite Partners',
      message: 'You already have a booking. Do you want to invite partners to join you?',
      onConfirm: async () => {
        // 空值检查：确保 myBookingInCurrentSlot 存在且 bookingId 有效
        const currentBooking = myBookingInCurrentSlot.value
        if (!currentBooking) {
          showError('未找到当前预订，请刷新页面重试')
          return
        }

        const bookingId = currentBooking.bookingId
        if (!bookingId) {
          showError('预订 ID 无效，请刷新页面重试')
          return
        }

        try {
          await changeSeat({
            bookingId,
            newSeatId: targetSeat.backendSeatId,
            invitePartners,
          })
          await handleSuccess()
        } catch (error) {
          const errorMessage = parseApiError(error)
          showError(errorMessage || '邀请失败')
        }
      },
    }
    showConfirmModal.value = true
  } else {
    // 场景 3 & 4：正常选座/邀请 -> 调用 makeBooking 接口
    try {
      await makeBooking({
        areaId: areas.value[0]?.id,
        seatId: targetSeat.backendSeatId,
        timeSlots: selectedTimeSlots.value.map((slot) => ({
          bookingDate: slot.dateISO,
          timeSlotId: Number(slot.timeSlotId),
        })),
        invitePartners,
      })
      await handleSuccess()
    } catch (error) {
      const errorMessage = parseApiError(error)
      showError(errorMessage || '预订失败')
    }
  }
}

// 数据刷新封装（支持多时段）
async function refreshData() {
  if (selectedTimeSlots.value.length > 0) {
    await executeBatchSeatAvailabilityQuery()
  }
}

// ========== 批量换座逻辑 ==========

/**
 * 换座操作 - 应用到所有选定时段
 * @param newSeatId - 新座位ID
 */
const swapSeatForAllSlots = async (newSeatId: number) => {
  if (selectedTimeSlots.value.length === 0) {
    return showError('请先选择时段')
  }

  // 查找当前预订
  const currentBooking = myBookingInCurrentSlot.value
  if (!currentBooking) {
    return showError('没有找到当前预订')
  }

  // 空值检查：确保 bookingId 有效
  const bookingId = currentBooking.bookingId
  if (!bookingId) {
    showError('预订 ID 无效，请刷新页面重试')
    return
  }

  try {
    // 准备换座数据
    const invitePartners =
      invitedPartners.value.length > 0
        ? invitedPartners.value
            .map((partner) => {
              const assignedSeat = seats.value.find(
                (s) => s.id === assignNearbySeats(selectedSeat.value || '', 1)[0],
              )
              return assignedSeat?.backendSeatId
                ? {
                    userId: String(partner.id),
                    openId: partner.openId || '',
                    username: partner.username || partner.fullName,
                    seatId: assignedSeat.backendSeatId,
                  }
                : null
            })
            .filter((p) => p !== null)
        : undefined

    // 调用换座 API（通过 composable）
    await changeSeat({
      bookingId,
      newSeatId: newSeatId,
      invitePartners,
    })

    showSuccess('换座成功')
    await loadBookingHistory() // 刷新预订历史
    await refreshData() // 刷新座位可用性
  } catch (error) {
    const errorMessage = parseApiError(error)
    showError(errorMessage || '换座失败')
  }
}

// 返回首页
const goBack = () => {
  router.back()
}
</script>

<template>
  <div
    class="relative min-h-screen bg-gradient-to-b from-transparent from-20% via-white via-30% to-white"
  >
    <!-- ========== 顶部导航栏 ========== -->
    <div class="sticky top-0 z-30 backdrop-blur-sm">
      <div class="flex items-center justify-between px-6 py-4">
        <button
          @click="goBack"
          class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-light transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19.9201L8.47997 13.4001C7.70997 12.6301 7.70997 11.3701 8.47997 10.6001L15 4.08008"
              stroke="#292D32"
              stroke-width="1.5"
              stroke-miterlimit="10"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <h1 class="text-xl font-medium text-gray-dark">Booking Seats</h1>
        <div class="w-10"></div>
      </div>
    </div>

    <!-- ========== 主要内容区域 ========== -->
    <div class="px-6 py-6 pb-28 max-w-2xl mx-auto">
      <!-- ========== Seat Selection Area ========== -->
      <section class="mb-6">
        <div class="opacity-90 pointer-events-none">
          <SeatMap :seats="seats" :selected-seat="selectedSeat" @select-seat="() => {}" />
        </div>
      </section>

      <div class="flex items-center justify-center w-full min-h-[64px]">
        <button
          v-if="!selectedSeat && !myBookingInCurrentSlot"
          @click="openSeatModal"
          :disabled="isLoadingSeats || selectedTimeSlots.length === 0"
          class="px-10 py-2.5 bg-gray-dark text-white text-base font-medium rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingSeats ? 'Loading Seats...' : 'Select Seat' }}
        </button>

        <div v-else class="flex flex-col items-end w-full max-w-2xl">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-4">
              <span class="text-sm font-medium text-gray-dark opacity-60 tracking-tight"
                >Your Seat</span
              >
              <span class="text-3xl font-black text-gray-dark tracking-tighter">
                {{ selectedSeat || myBookingInCurrentSlot?.id || '--' }}
              </span>
            </div>

            <button
              @click="openSeatModal"
              class="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-dark hover:bg-gray-50 transition-all"
            >
              Change Seat
            </button>
          </div>

          <p class="mt-2 text-[10px] font-bold text-gray-400 italic uppercase tracking-wider">
            * Operation applied to all booked slots
          </p>
        </div>
      </div>
      <!-- ========== Divider ========== -->
      <div class="h-8 block"></div>

      <!-- ========== Date and Time Selection ========== -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-medium text-gray-dark tracking-tight">Date & Time</h2>
        </div>

        <div class="space-y-4">
          <div v-for="(slot, dateIndex) in timeSlots" :key="slot.id" class="flex gap-4 items-start">
            <!-- Date display -->
            <div class="w-20 flex-shrink-0">
              <div class="text-2xl font-bold text-gray-dark tracking-tight">{{ slot.date }}</div>
              <div class="text-xs text-gray mt-1 tracking-tight">{{ slot.weekday }}</div>
            </div>

            <!-- Time slot selection -->
            <div class="flex-1 space-y-2">
              <button
                v-for="(time, timeIndex) in slot.times"
                :key="time.id"
                @click="toggleTimeSlot(dateIndex, timeIndex)"
                :disabled="time.disabled"
                class="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm font-medium transition-all tracking-tight"
                :class="[
                  time.selected
                    ? 'bg-success text-white shadow-md border-success'
                    : time.disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                      : 'border-gray-100 text-gray-dark hover:border-gray-dark',
                ]"
              >
                <div class="flex items-center justify-between">
                  <span>{{ time.time }}</span>
                  <span v-if="time.selected" class="ml-2">✓</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== Divider ========== -->
      <div class="h-8 block"></div>

      <!-- ========== Invite Partners ========== -->
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">Invite Partner</h2>

        <div class="flex flex-wrap gap-3">
          <!-- Invited partner tags -->
          <button
            v-for="partner in invitedPartners"
            :key="partner.id"
            @click="removePartner(partner)"
            class="inline-flex items-center gap-2 px-3.5 py-2 bg-[#E9E1F8] rounded-full hover:bg-[#DED2F5] group transition-all"
          >
            <span class="text-sm font-semibold text-[#784DC7] items-center">
              {{ partner.fullName }}
            </span>

            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="transition-transform"
            >
              <circle cx="8" cy="8" r="7" fill="#784DC7" />
              <path
                d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5"
                stroke="white"
                stroke-width="0.9"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <!-- Add partner button -->
          <button
            @click="openFindPartnerModal"
            class="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-100 rounded-full hover:border-gray-dark transition-colors group"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="text-gray group-hover:text-gray-dark transition-colors"
            >
              <path
                d="M9 3.75V14.25M3.75 9H14.25"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <span
              class="text-sm font-medium text-gray group-hover:text-gray-dark transition-colors"
            >
              Add Partner
            </span>
          </button>
        </div>
      </section>

      <!-- ========== Booking Summary ========== -->
      <section
        v-if="(selectedSeat || myBookingInCurrentSlot) && selectedTimeSlots.length > 0"
        class="bg-primary-light/30 rounded-2xl p-6"
      >
        <h3 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">
          {{ selectedSeat ? 'Booking Summary' : 'Current Booking' }}
        </h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray">Seat</span>
            <span class="font-medium text-gray-dark">{{
              selectedSeat || myBookingInCurrentSlot?.id || '--'
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray">Time Slots</span>
            <span class="font-medium text-gray-dark">{{ selectedTimeSlots.length }} selected</span>
          </div>
          <!-- 显示选中的时段列表 -->
          <div class="space-y-1">
            <div
              v-for="(slot, index) in selectedTimeSlots"
              :key="index"
              class="flex justify-between text-xs"
            >
              <span class="text-gray">{{ slot.date }}</span>
              <span class="text-gray-dark">{{ slot.time }}</span>
            </div>
          </div>
          <div v-if="selectedSeat" class="flex justify-between">
            <span class="text-gray">Partners</span>
            <span class="font-medium text-gray-dark">{{ invitedPartners.length }}</span>
          </div>
          <div v-if="selectedSeat" class="border-t border-primary/20 pt-3 mt-3"></div>
          <div v-if="selectedSeat" class="flex justify-between items-center">
            <span class="text-gray">Coins Used</span>
            <div class="flex items-center gap-2">
              <img src="@/assets/images/home/Vector.png" alt="" class="w-5 h-5" />
              <span class="font-bold text-cyan text-lg">{{
                coinCost * selectedTimeSlots.length
              }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ========== Fixed Bottom Action Bar ========== -->
    <div class="fixed bottom-0 left-0 right-0 bg-white px-6 py-4 z-20 shadow-lg">
      <div class="flex justify-between items-center max-w-2xl mx-auto gap-3">
        <!-- 我的预订按钮 -->
        <div class="relative">
          <button
            @click="openBookingHistory"
            class="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-gray-100 bg-white hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <img src="@/assets/images/booking/History.png" alt="" class="w-6 h-6" />
          </button>

          <div
            v-if="bookingHistory.length > 0"
            class="absolute -top-2 -right-2 w-7 h-7 bg-[#39D37F] border-4 border-white rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
          >
            {{ bookingHistory.length }}
          </div>
        </div>

        <!-- Book Now 按钮 -->
        <button
          @click="bookNow"
          :disabled="
            isBookingLoading ||
            isLoadingSeats ||
            selectedTimeSlots.length === 0 ||
            (!selectedSeat && !(myBookingInCurrentSlot && invitedPartners.length > 0))
          "
          class="w-1/2 py-2.5 text-lg font-bold text-white rounded-xl bg-[#2C2C2C] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {{ isBookingLoading ? 'Processing...' : 'Book Now' }}
        </button>
      </div>
    </div>

    <!-- ========== 模态框组件 ========== -->

    <!-- 座位选择模态框 -->
    <SeatSelectionModal
      v-model:visible="showSeatModal"
      :seats="seats"
      :selected-seat="selectedSeat"
      :highlighted-partner="highlightedPartner"
      @select-seat="handleSeatSelect"
      @confirm="confirmSeatSelection"
      @find-partner="openFindPartnerFromSeatModal"
      @clear-highlight="clearHighlight"
    />

    <!-- 查找伙伴模态框 -->
    <FindPartnerModal
      v-if="showSeatModal"
      v-model:visible="showFindPartnerModal"
      v-model:selected-partners="invitedPartners"
      :selected-time-slots="selectedTimeSlots"
      @confirm="confirmPartnerInvite"
      @select-partner="handlePartnerSelect"
    />

    <InvitePartnerModal
      v-else
      v-model:visible="showFindPartnerModal"
      v-model:selected-partners="invitedPartners"
      @confirm="confirmPartnerInvite"
    />

    <!-- 成功模态框 -->
    <SuccessModal v-model:visible="showSuccessModal" />

    <!-- 预订历史模态框 -->
    <BookingHistoryModal
      v-model:visible="showBookingHistoryModal"
      :bookings="bookingHistory"
      :is-loading="isLoadingHistory"
      @cancel-booking="cancelBookingById"
    />

    <!-- 确认模态框 -->
    <ConfirmModal
      v-model:visible="showConfirmModal"
      :title="confirmModalConfig.title"
      :message="confirmModalConfig.message"
      @confirm="confirmModalConfig.onConfirm"
    />
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b9b9b9;
}
</style>
