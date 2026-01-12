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
import type { TimeSlot, Partner, SelectedTimeSlot } from '../types/booking'
import { MAX_TIME_SLOT_SELECTION } from '../types/booking'
import { getMyBookings, cancelBooking as cancelBookingAPI } from '../api'

const router = useRouter()
const { error: showError, success: showSuccess } = useToast()

// 使用座位管理组合式函数
const {
  areas,
  seats,
  seatAvailability,
  selectedSeat,
  selectSeat,
  clearSelection,
  isLoading: isLoadingSeats,
  loadTimeSlots, // 导入 loadTimeSlots
  loadAreasWithCache, // 加载区域（带缓存）
  loadSeatMapWithCache, // 加载座位图（带缓存）
  queryBatchSeatAvailability, // 导入批量查询座位可用性
} = useSeats()

// 使用预订管理组合式函数
const {
  makeBooking,
  changeSeat,
  isLoading: isBookingLoading,
  removeBooking,
} = useBooking()

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

const bookingHistory = ref<any[]>([])
const isLoadingHistory = ref(false)

// 加载预订历史
const loadBookingHistory = async () => {
  isLoadingHistory.value = true
  try {
    const response = await getMyBookings({ skip: 0, limit: 20 })
    bookingHistory.value = response.bookings || response.data?.bookings || []
  } catch (error: any) {
    console.error('加载预订历史失败:', error)
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
  } catch (error: any) {
    showError('取消预订失败')
  }
}

// 打开预订历史弹框
const openBookingHistory = async () => {
  showBookingHistoryModal.value = true
  // 刷新预订历史数据
  await loadBookingHistory()
}

// 聚合显示预订信息（同一座位的多个时段聚合为一条记录）
const aggregatedBookings = computed(() => {
  const groups = new Map<number, any[]>()

  bookingHistory.value.forEach((booking) => {
    const key = booking.groupId || booking.id
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(booking)
  })

  return Array.from(groups.entries()).map(([groupId, bookings]) => {
    const firstBooking = bookings[0]
    // 适配新的 API 数据格式：timeSlotDetails 数组
    const timeSlotDetails = bookings.flatMap((b: any) => {
      if (b.timeSlotDetails && Array.isArray(b.timeSlotDetails)) {
        return b.timeSlotDetails.map((detail: any) => ({
          bookingDate: detail.bookingDate,
          startTime: detail.startTime || detail.timeSlotName?.split('-')[0]?.trim() || '',
          endTime: detail.endTime || detail.timeSlotName?.split('-')[1]?.trim() || '',
          timeSlotId: detail.timeSlotId
        }))
      }
      // 兼容旧格式（如果有单个时段信息）
      if (b.bookingDate && b.timeSlot) {
        return [{
          bookingDate: b.bookingDate,
          startTime: b.timeSlot.startTime || '',
          endTime: b.timeSlot.endTime || '',
          timeSlotId: b.timeSlotId || 0
        }]
      }
      return []
    })

    return {
      groupId,
      bookings,
      seat: firstBooking.seatNumber || firstBooking.seat || '',
      timeSlots: timeSlotDetails,
      totalCredits: bookings.reduce((sum: number, b: any) => sum + (b.creditsUsed || b.totalCreditsUsed || 0), 0)
    }
  })
})

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
  // 这符合“单座位+多时段”的逻辑
  return seats.value.find((s: any) => s.bookedByMe)
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
const adaptTimeSlots = (backendSlots: any[]) => {
  const backendTimeSlots = backendSlots.map((slot: any) => {
    // 判断今天的时间段是否已过期 (超过开始时间即过期)
    const isExpiredToday = isBookingExpired(formatDateISO(today.value), slot.startTime)
    return {
      id: String(slot.id), // 确保是字符串
      time: `${slot.startTime} - ${slot.endTime}`,
      isExpiredToday: isExpiredToday, // 标记今天的时间段是否已过期
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
      times: backendTimeSlots.map((slot: any) => ({
        ...slot,
        selected: false, // 初始都不选中，稍后统一处理
        disabled: slot.isExpiredToday, // 今天已过期的时间段禁用
      })),
    },
    {
      id: '2',
      date: formatDate(tomorrow.value),
      weekday: getWeekday(tomorrow.value),
      dateISO: formatDateISO(tomorrow.value),
      times: backendTimeSlots.map((slot: any) => ({
        ...slot,
        selected: false,
        disabled: false, // 明天的时间段不禁用
      })),
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
                isExpired: timeSlot.disabled || false
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
              isExpired: firstAvailable.disabled || false
            })
            break
          }
        }
      }

      // 如果有选中的时段，触发批量查询
      if (selectedTimeSlots.value.length > 0) {
        await executeBatchSeatAvailabilityQuery()
      }
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
      isExpired: slot.disabled || false
    })
    slot.selected = true
  }

  // 触发批量可用性查询
  if (selectedTimeSlots.value.length > 0) {
    await executeBatchSeatAvailabilityQuery()
  } else {
    // 如果没有选中任何时段，清空座位状态
    clearSelection()
  }
}

// 批量查询座位可用性（使用 composable 中的函数）
const executeBatchSeatAvailabilityQuery = async () => {
  if (selectedTimeSlots.value.length === 0) return

  // 构建批量查询参数
  const queryParams = selectedTimeSlots.value.map((slot) => ({
    areaId: areas.value[0]?.id,
    bookingDate: slot.dateISO,
    timeSlotId: Number(slot.timeSlotId)
  }))

  try {
    // 调用 composable 中的批量查询函数
    // 这个函数会更新 seatAvailability.value，供 FindPartnerModal 使用
    // 同时也会调用 updateSeatsStatus 更新 seats 状态
    await queryBatchSeatAvailability(queryParams)

    // 额外处理：根据选中座位更新时段的禁用状态
    // 这部分逻辑是 BookingPage 特有的，需要保留在这里
    if (selectedSeat.value) {
      const selectedSeatObj = seats.value.find(s => s.id === selectedSeat.value)
      if (selectedSeatObj) {
        const seatBackendId = selectedSeatObj.backendSeatId

        // 获取 seatAvailability 数据来检查每个时段该座位的可用性
        if (seatAvailability.value && seatAvailability.value.length > 0) {
          timeSlots.value.forEach(dateSlot => {
            dateSlot.times.forEach(time => {
              // 从 seatAvailability 中查找该座位在这个时段的可用性
              const seatInfo = seatAvailability.value.find(s => s.backendSeatId === seatBackendId)
              if (seatInfo && !seatInfo.isAvailable && !time.selected) {
                time.disabled = true
              } else if (seatInfo && seatInfo.isAvailable) {
                time.disabled = time.isExpiredToday || false
              }
            })
          })
        }
      }
    }
  } catch (error: any) {
    console.error('批量查询座位可用性失败:', error)
    showError('查询座位可用性失败，请稍后重试')
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
	            areaId: areas.value.length > 0 ? areas.value[0].id : undefined
	          }).then((exists) => ({
	            partner,
	            slot,
	            exists
	          }))
	        )
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
	      console.error('校验伙伴状态失败:', err)
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
	            seatId: assignedSeat.backendSeatId
	          }
	        : null
	    })
	    .filter((p) => p !== null)
	
	  /**
	   * 成功后的清理与刷新逻辑
	   */
	  const handleSuccess = async () => {
	    showSuccessModal.value = true
	    await loadBookingHistory()
	    clearSelection()
	    invitedPartners.value = []
	    
	    // 重置时段选择
	    timeSlots.value.forEach((slot) => {
	      slot.times.forEach((time) => {
	        time.selected = false
	        time.disabled = time.isExpiredToday || false
	      })
	    })
	    selectedTimeSlots.value = []
	
	    // 重新选择第一个可用时段并刷新
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
	          isExpired: firstAvailable.disabled || false
	        })
	        break
	      }
	    }
	    if (selectedTimeSlots.value.length > 0) await executeBatchSeatAvailabilityQuery()
	  }
	
	  // 4. 场景判断与执行
	  const isChangingSeat = !!selectedSeat.value && !!myBookingInCurrentSlot.value
	  const isInvitingOnly = !selectedSeat.value && !!myBookingInCurrentSlot.value && invitedPartners.value.length > 0
	
	  if (isChangingSeat) {
	    // 场景 1：切换座位 -> 调用 swap-seat 接口
	    confirmModalConfig.value = {
	      title: 'Change Seat',
	      message: 'You already have a booking. Do you want to change your seat for all selected time slots?',
	      onConfirm: async () => {
	        try {
	          await changeSeat({
	            bookingId: (myBookingInCurrentSlot.value as any).bookingId,
	            newSeatId: targetSeat.backendSeatId,
	            invitePartners
	          })
	          await handleSuccess()
	        } catch (error: any) {
	          showError(error.message || '换座失败')
	        }
	      }
	    }
	    showConfirmModal.value = true
	  } else if (isInvitingOnly) {
	    // 场景 2：直接邀请好友 -> 调用 swap-seat 接口（座位 ID 不变）
	    confirmModalConfig.value = {
	      title: 'Invite Partners',
	      message: 'You already have a booking. Do you want to invite partners to join you?',
	      onConfirm: async () => {
	        try {
	          await changeSeat({
	            bookingId: (myBookingInCurrentSlot.value as any).bookingId,
	            newSeatId: targetSeat.backendSeatId,
	            invitePartners
	          })
	          await handleSuccess()
	        } catch (error: any) {
	          showError(error.message || '邀请失败')
	        }
	      }
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
	          timeSlotId: Number(slot.timeSlotId)
	        })),
	        invitePartners
	      })
	      await handleSuccess()
	    } catch (error: any) {
	      showError(error.message || '预订失败')
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

  try {
    // 准备换座数据
    const invitePartners = invitedPartners.value.length > 0
      ? invitedPartners.value.map((partner) => {
          const assignedSeat = seats.value.find((s) => s.id === assignNearbySeats(selectedSeat.value || '', 1)[0])
          return assignedSeat?.backendSeatId
            ? {
                userId: String(partner.id),
                openId: partner.openId || '',
                username: partner.username || partner.fullName,
                seatId: assignedSeat.backendSeatId
              }
            : null
        }).filter((p) => p !== null)
      : undefined

    // 调用换座 API（通过 composable）
    await changeSeat({
      bookingId: (currentBooking as any).bookingId,
      newSeatId: newSeatId,
      invitePartners
    })

    showSuccess('换座成功')
    await loadBookingHistory() // 刷新预订历史
    await refreshData() // 刷新座位可用性
  } catch (error: any) {
    showError('换座失败')
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
          :disabled="isLoadingSeats"
          class="px-10 py-2.5 bg-gray-dark text-white text-base font-medium rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingSeats ? 'Loading Seats...' : 'Select Seat' }}
        </button>

        <div v-else class="flex items-center justify-between w-full max-w-2xl">
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-gray-dark tracking-tight">Your Seat</span>
            <span class="text-3xl font-bold text-gray-dark tracking-tighter">
              {{ selectedSeat || (myBookingInCurrentSlot as any)?.id }}
            </span>
          </div>

          <button
            @click="openSeatModal"
            class="px-5 py-2.5 border-2 border-gray-100 rounded-xl text-sm font-semibold text-gray-dark hover:bg-gray-50 active:scale-95 transition-all"
          >
            Change Seat
          </button>
        </div>
      </div>
      <!-- ========== Divider ========== -->
      <div class="h-8 block"></div>

      <!-- ========== Date and Time Selection ========== -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-medium text-gray-dark tracking-tight">Date & Time</h2>
          <div class="text-xs text-gray">
            已选: {{ selectedTimeSlotCount }}/{{ maxTimeSlotSelection }}
          </div>
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
              selectedSeat || (myBookingInCurrentSlot as any)?.id
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray">Time Slots</span>
            <span class="font-medium text-gray-dark">{{ selectedTimeSlots.length }} 个时段</span>
          </div>
          <!-- 显示选中的时段列表 -->
          <div class="space-y-1 pl-2">
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
              <span class="font-bold text-cyan text-lg">{{ coinCost * selectedTimeSlots.length }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ========== Fixed Bottom Action Bar ========== -->
    <div class="fixed bottom-0 left-0 right-0 bg-white px-6 py-4 z-20 shadow-lg">
      <div class="flex justify-between items-center max-w-2xl mx-auto gap-3">
        <!-- 我的预订按钮 -->
        <button
          @click="openBookingHistory"
          class="flex-1 py-4 text-base font-bold text-gray-dark rounded-xl border-2 border-gray-100 hover:border-gray-dark hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          My Bookings
        </button>

        <!-- Book Now 按钮 -->
        <button
          @click="bookNow"
          :disabled="
            isBookingLoading ||
            isLoadingSeats ||
            selectedTimeSlots.length === 0 ||
            (!selectedSeat && !(myBookingInCurrentSlot && invitedPartners.length > 0))
          "
          class="flex-1 py-4 text-lg font-bold text-white rounded-xl bg-[#2C2C2C] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
      :bookings="aggregatedBookings"
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
