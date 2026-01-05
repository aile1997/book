<script setup lang="ts">
import NProgress from 'nprogress'
import { ref, computed, onMounted } from 'vue'
import { useBooking } from '../composables/useBooking' // 导入 useBooking
import { useAuth } from '../composables/useAuth' // 导入 useAuth 检查登录状态
import { useRouter } from 'vue-router'
import { useSeats } from '../composables/useSeats'
import { useToast } from '../composables/useToast'
import SeatMap from '../components/features/SeatMap.vue'
import InvitePartnerModal from '../components/modals/InvitePartnerModal.vue'
import FindPartnerModal from '../components/modals/FindPartnerModal.vue'
import SeatSelectionModal from '../components/modals/SeatSelectionModal.vue'
import SuccessModal from '../components/modals/SuccessModal.vue'
import type { TimeSlot, Partner } from '../types/booking'

const router = useRouter()
const { error: showError } = useToast()

// 使用座位管理组合式函数
const {
  seats,
  selectedSeat,
  selectSeat,
  clearSelection,
  isLoading: isLoadingSeats,
  querySeatAvailability, // 查询可用性函数
  loadTimeSlots, // 导入 loadTimeSlots
  loadAreasWithCache, // 加载区域（带缓存）
  loadSeatMapWithCache, // 加载座位图（带缓存）
  seatAvailability,
} = useSeats()

// 使用预订管理组合式函数
const {
  makeBooking,
  isLoading: isBookingLoading,
  error: bookingError,
  removeBooking,
} = useBooking()

// 使用认证组合式函数
const { isAuthenticated, user } = useAuth()

// ========== 状态管理 ==========

// 邀请的伙伴列表
const invitedPartners = ref<Partner[]>([])

// Coins 消耗
const coinCost = ref(5)

// 模态框状态
const showSeatModal = ref(false)
const showFindPartnerModal = ref(false)
const showSuccessModal = ref(false)

// 高亮显示的伙伴（用于在座位图上显示tooltip）
const highlightedPartner = ref<{ name: string; seat: string } | null>(null)

// ========== 时间段数据 ==========

// 辅助函数：格式化日期为 11.20 这种格式
const formatDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}.${day}`
}
// 辅助函数：格式化日期为 YYYY-MM-DD 格式
const formatDateISO = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 辅助函数：获取星期缩写
const getWeekday = (date: Date) => {
  const weekdays = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
  return weekdays[date.getDay()]
}

// 计算当前时间段是否有我的预订
const myBookingInCurrentSlot = computed(() => {
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
  const now = new Date()
  const nowTime = now.getHours() * 60 + now.getMinutes() // 当前时间（分钟）

  const backendTimeSlots = backendSlots.map((slot: any) => {
    // 解析开始时间为分钟
    const [startHour, startMinute] = slot.startTime.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + startMinute

    // 判断今天的时间段是否已过期 (超过开始时间即过期)
    const isExpiredToday =
      formatDateISO(now) === formatDateISO(today.value) && nowTime >= startTimeInMinutes

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

    // 3. 业务逻辑处理：默认选中并查询可用性
    if (timeSlots.value.length > 0) {
      let firstAvailableTimeSlot = null
      for (const dateSlot of timeSlots.value) {
        firstAvailableTimeSlot = dateSlot.times.find((time) => !time.disabled)
        if (firstAvailableTimeSlot) {
          firstAvailableTimeSlot.selected = true
          break
        }
      }

      if (selectedDateTime.value) {
        // 等待关键的可用性查询完成
        await querySeatAvailability(
          selectedDateTime.value.dateISO,
          Number(selectedDateTime.value.timeSlotId),
        )
      }
    }
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

// 切换时间段选择
const toggleTimeSlot = (dateIndex: number, timeIndex: number) => {
  // 先取消所有选择
  timeSlots.value.forEach((slot) => {
    slot.times.forEach((time) => {
      time.selected = false
    })
  })
  // 选中新的时间段
  timeSlots.value[dateIndex].times[timeIndex].selected = true

  // 触发可用性查询
  if (selectedDateTime.value) {
    // 查询所有区域的可用性
    querySeatAvailability(selectedDateTime.value.dateISO, Number(selectedDateTime.value.timeSlotId)) // 不传 areaId，查询所有区域
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

// 预订执行函数重构
const bookNow = async () => {
  if (!isAuthenticated.value) return showError('请先登录才能进行预订操作')
  if (!selectedDateTime.value) return showError('请先选择预订时间段')

  // 1. 确定目标座位：如果没选新座但有旧座，则使用旧座（用于直接邀请场景）
  const targetSeat = selectedSeat.value 
    ? seats.value.find(s => s.id === selectedSeat.value)
    : myBookingInCurrentSlot.value

  if (!targetSeat?.backendSeatId) return showError('请先选择有效的座位')

  // 2. 校验伙伴是否已在当前时间段有预订（本地校验）
  const partnersWithBooking = invitedPartners.value.filter(partner => {
    // 在当前座位的可用性数据中查找该伙伴
    return seatAvailability.value.some(avail => 
      avail.bookingUserInfo?.userId === partner.id && !avail.isAvailable
    )
  })

  if (partnersWithBooking.length > 0) {
    const names = partnersWithBooking.map(p => p.fullName).join(', ')
    return showError(`伙伴 ${names} 在该时间段已有预订，无法重复邀请`)
  }

  // 3. 准备预订数据
  const partnerAllocations = assignNearbySeats(targetSeat.id, invitedPartners.value.length)
  const invitePartners = invitedPartners.value
    .map((partner, index) => {
      const assignedSeat = seats.value.find(s => s.id === partnerAllocations[index])
      return assignedSeat?.backendSeatId ? {
        userId: partner.id,
        openId: partner.openId || '',
        username: partner.username || partner.fullName,
        seatId: assignedSeat.backendSeatId,
      } : null
    })
    .filter(p => p !== null)

  const bookingData = {
    seatId: targetSeat.backendSeatId,
    bookingDate: selectedDateTime.value.dateISO,
    timeSlotId: Number(selectedDateTime.value.timeSlotId),
    invitePartners
  }

  try {
    // 场景判断与执行
    if (myBookingInCurrentSlot.value) {
      const isChangingSeat = !!selectedSeat.value
      
      // 场景 1 & 2: 切换座位或直接邀请好友
      const confirmMsg = isChangingSeat 
        ? '当前时间段您已经有预订，是否切换座位？' 
        : '当前时间段您已经有预订，是否直接邀请好友？'
      
      if (confirm(confirmMsg)) {
        // 必须先取消旧预订（因为 makeBooking 不支持追加邀请或直接覆盖）
        const oldBookingId = (myBookingInCurrentSlot.value as any).bookingId
        if (oldBookingId) {
          await removeBooking(oldBookingId)
          await makeBooking(bookingData)
          showSuccessModal.value = true
        }
      }
    } else {
      // 场景 3 & 4: 正常选座或正常选座邀请
      await makeBooking(bookingData)
      showSuccessModal.value = true
    }

    if (showSuccessModal.value) {
      await refreshData()
      clearSelection()
      invitedPartners.value = []
    }
  } catch (error: any) {
    showError(error.message || '预订失败，请稍后重试')
  }
}

// 数据刷新封装
async function refreshData() {
  if (selectedDateTime.value) {
    await querySeatAvailability(
      selectedDateTime.value.dateISO,
      Number(selectedDateTime.value.timeSlotId),
    )
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
          class="px-10 py-3 bg-gray-dark text-white text-base font-medium rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingSeats ? 'Loading Seats...' : 'Select Seat' }}
        </button>

        <div v-else class="flex items-center justify-between w-full max-w-2xl px-2">
          <div class="flex items-baseline gap-4">
            <span class="text-sm font-medium text-gray-400 tracking-tight">Your Seat</span>
            <span class="text-3xl font-bold text-gray-dark tracking-tighter">
              {{ selectedSeat || myBookingInCurrentSlot.id }}
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
      <div class="border-t border-gray-light my-8"></div>

      <!-- ========== Date and Time Selection ========== -->
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">Date & Time</h2>

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
                class="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all tracking-tight border-2"
                :class="[
                  time.selected
                    ? 'bg-success text-white shadow-md border-success'
                    : time.disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                      : 'border-gray-light text-gray-dark hover:border-gray-dark',
                ]"
              >
                {{ time.time }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== Divider ========== -->
      <div class="border-t border-gray-light my-8"></div>

      <!-- ========== Invite Partners ========== -->
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">Invite Partner</h2>

        <div class="flex flex-wrap gap-3">
          <!-- Invited partner tags -->
          <button
            v-for="partner in invitedPartners"
            :key="partner.id"
            @click="removePartner(partner)"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gray-light rounded-full text-sm font-medium text-gray-dark hover:bg-gray-200 transition-colors"
          >
            {{ partner.fullName }}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="opacity-60 group-hover:opacity-100 transition-opacity"
            >
              <circle cx="8" cy="8" r="7" fill="#784DC7" />
              <path
                d="M5 5L11 11M11 5L5 11"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <!-- Add partner button -->
          <button
            @click="openFindPartnerModal"
            class="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-light rounded-full hover:border-gray-dark transition-colors group"
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

        <!-- Tip message -->
        <p class="text-xs text-gray mt-3">Click tag to remove invited partner</p>
      </section>

      <!-- ========== Booking Summary ========== -->
      <section
        v-if="(selectedSeat || myBookingInCurrentSlot) && selectedDateTime"
        class="bg-primary-light/30 rounded-2xl p-6 border border-primary/20"
      >
        <h3 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">
          {{ selectedSeat ? 'Booking Summary' : 'Current Booking' }}
        </h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray">Seat</span>
            <span class="font-medium text-gray-dark">{{
              selectedSeat || myBookingInCurrentSlot.id
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray">Date</span>
            <span class="font-medium text-gray-dark"
              >{{ selectedDateTime.date }} ({{ selectedDateTime.weekday }})</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray">Time</span>
            <span class="font-medium text-gray-dark">{{ selectedDateTime.time }}</span>
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
              <span class="font-bold text-cyan text-lg">{{ coinCost }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ========== Fixed Bottom Action Bar ========== -->
    <div class="fixed bottom-0 left-0 right-0 bg-white px-6 py-4 z-20 shadow-lg">
      <div class="flex justify-end max-w-2xl mx-auto">
        <div class="flex items-center gap-3 w-2/3">
          <div class="flex items-center gap-1.5 px-3 py-2 bg-cyan/10 rounded-xl flex-shrink-0">
            <img src="@/assets/images/home/Vector.png" alt="" class="w-5 h-5" />
            <span class="text-base font-bold text-cyan">{{ coinCost }}</span>
          </div>

          <button
            @click="bookNow"
            :disabled="
              isBookingLoading || 
              isLoadingSeats || 
              (!selectedSeat && !(myBookingInCurrentSlot && invitedPartners.length > 0))
            "
            class="w-full py-4 text-lg font-bold text-white rounded-xl bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isBookingLoading ? 'Processing...' : 'Book Now' }}
          </button>
        </div>
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
