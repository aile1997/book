<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBooking } from '../composables/useBooking' // 导入 useBooking
import { useAuth } from '../composables/useAuth' // 导入 useAuth 检查登录状态
import { useRouter } from 'vue-router'
import { useSeats } from '../composables/useSeats'
import SeatMap from '../components/SeatMap.vue'
import InvitePartnerModal from '../components/InvitePartnerModal.vue'
import FindPartnerModal from '../components/FindPartnerModal.vue'
import SeatSelectionModal from '../components/SeatSelectionModal.vue'
import SuccessModal from '../components/SuccessModal.vue'
import type { TimeSlot, Partner } from '../types/booking'

const router = useRouter()

// 使用座位管理组合式函数
const {
  seats,
  seatAvailability, // 可用性数据
  selectedSeat,
  selectSeat,
  clearSelection,
  isLoading: isLoadingSeats,
  error: seatError,
  querySeatAvailability, // 查询可用性函数
  loadAreas, // 加载区域列表
  loadSeatMap, // 加载座位图
  loadTimeSlots, // 导入 loadTimeSlots
} = useSeats()

// 使用预订管理组合式函数
const { makeBooking, isLoading: isBookingLoading, error: bookingError } = useBooking()

// 使用认证组合式函数
const { isAuthenticated, signIn } = useAuth()

// ========== 状态管理 ==========

// 邀请的伙伴列表
const invitedPartners = ref<Partner[]>([])

// Coins 消耗
const coinCost = ref(10)

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

// 辅助函数：获取星期缩写
const getWeekday = (date: Date) => {
  const weekdays = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
  return weekdays[date.getDay()]
}

// 获取今天和明天的 Date 对象
const today = new Date()
const tomorrow = new Date()
tomorrow.setDate(today.getDate() + 1)

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
      now.toISOString().split('T')[0] === today.toISOString().split('T')[0] &&
      nowTime >= startTimeInMinutes

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
      date: formatDate(today),
      weekday: getWeekday(today),
      dateISO: today.toISOString().split('T')[0],
      times: backendTimeSlots.map((slot: any, index: number) => ({
        ...slot,
        selected: false, // 初始都不选中，稍后统一处理
        disabled: slot.isExpiredToday, // 今天已过期的时间段禁用
      })),
    },
    {
      id: '2',
      date: formatDate(tomorrow),
      weekday: getWeekday(tomorrow),
      dateISO: tomorrow.toISOString().split('T')[0],
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
  // 0. 清除上一次的选择状态，确保数据状态一致性
  clearSelection()

  // 1. 确保 loadAreas 和 loadSeatMap 只在 seats.value 为空时加载一次
  if (seats.value.length === 0) {
    await loadAreas()
    await loadSeatMap()
  }

  // 2. 加载时间段数据
  const backendSlots = await loadTimeSlots()
  if (backendSlots && backendSlots.length > 0) {
    adaptTimeSlots(backendSlots)
  }

  // 3. 默认选中第一个可用的时间段，并查询可用性
  if (timeSlots.value.length > 0) {
    // 查找第一个可用的时间段
    let firstAvailableTimeSlot = null
    for (const dateSlot of timeSlots.value) {
      firstAvailableTimeSlot = dateSlot.times.find(time => !time.disabled)
      if (firstAvailableTimeSlot) {
        // 选中它
        firstAvailableTimeSlot.selected = true
        break
      }
    }

    // 触发可用性查询
    if (selectedDateTime.value) {
      // 查询所有区域的可用性
      querySeatAvailability(
        selectedDateTime.value.dateISO,
        Number(selectedDateTime.value.timeSlotId),
      ) // 不传 areaId，查询所有区域
    }
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
const reselectSeat = () => {
  clearSelection()
  openSeatModal()
}

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
      name: partner.name,
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

// 修改预订执行函数
const bookNow = async () => {
  if (!isAuthenticated.value) {
    alert('请先登录才能进行预订操作。')
    // 实际应用中应跳转到登录页
    return
  }

  const seat = seats.value.find((s) => s.id === selectedSeat.value)
  if (!seat || !seat.backendSeatId) return alert('请先选择有效的座位')

  const selectedTimeSlot = selectedDateTime.value
  if (!selectedTimeSlot) return alert('请先选择预订时间段')

  // 自动分配邻座给伙伴
  const partnerAllocations = assignNearbySeats(selectedSeat.value, invitedPartners.value.length)

  // 构造 invitePartners 数组
  const invitePartners = invitedPartners.value.map((partner, index) => {
    const assignedSeat = seats.value.find((s) => s.id === partnerAllocations[index])
    
    // 确保分配了座位，否则不邀请
    if (assignedSeat && assignedSeat.backendSeatId) {
      return {
        userId: partner.id, // 维护前端 Partner.id 字段
        unionId: partner.unionId || '', // 维护 unionId 字段
        username: partner.username || partner.fullName, // 维护 username 字段
        seatId: assignedSeat.backendSeatId, // 分配的座位后端 ID
      }
    }
    return null
  }).filter(p => p !== null) // 过滤掉未分配座位的伙伴

  // 构造预订数据
  const bookingData = {
    seatId: seat.backendSeatId, // 后端座位 ID
    bookingDate: selectedTimeSlot.dateISO, // 日期
    timeSlotId: Number(selectedTimeSlot.timeSlotId), // 时间段 ID
    invitePartners: invitePartners,
  }

  try {
    await makeBooking(bookingData)
    // 预订成功
    showSuccessModal.value = true
    // 清除选择状态
    clearSelection()
    invitedPartners.value = []

    // !!! 关键修复：刷新座位可用性状态 !!!
    if (selectedDateTime.value) {
      querySeatAvailability(
        selectedDateTime.value.dateISO,
        Number(selectedDateTime.value.timeSlotId),
      )
    }
  } catch (error) {
    alert('预订失败: ' + (bookingError.value || '请检查网络或登录状态'))
    console.error('预订失败:', error)
  }
}

// 返回首页
const goBack = () => {
  router.back()
}

// 从成功页返回首页
const backToHome = () => {
  showSuccessModal.value = false
  router.push('/')
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
      <!-- ========== 座位选择区域 ========== -->
      <section class="mb-6">
        <div class="opacity-90 pointer-events-none">
          <SeatMap :seats="seats" :selected-seat="selectedSeat" @select-seat="() => {}" />
        </div>
      </section>

      <div class="flex items-center justify-center w-full min-h-[64px]">
        <button
          v-if="!selectedSeat"
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
              {{ selectedSeat }}
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
      <!-- ========== 分隔线 ========== -->
      <div class="border-t border-gray-light my-8"></div>

      <!-- ========== 日期和时间选择 ========== -->
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">Data & Time</h2>

        <div class="space-y-4">
          <div v-for="(slot, dateIndex) in timeSlots" :key="slot.id" class="flex gap-4 items-start">
            <!-- 日期显示 -->
            <div class="w-20 flex-shrink-0">
              <div class="text-2xl font-bold text-gray-dark tracking-tight">{{ slot.date }}</div>
              <div class="text-xs text-gray mt-1 tracking-tight">{{ slot.weekday }}</div>
            </div>

            <!-- 时间段选择 -->
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

      <!-- ========== 分隔线 ========== -->
      <div class="border-t border-gray-light my-8"></div>

      <!-- ========== 邀请伙伴 ========== -->
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">Invite Partner</h2>

        <div class="flex flex-wrap gap-3">
          <!-- 已邀请的伙伴标签 -->
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

          <!-- 添加伙伴按钮 -->
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
              添加伙伴
            </span>
          </button>
        </div>

        <!-- 提示信息 -->
        <p class="text-xs text-gray mt-3">点击标签可移除已邀请的伙伴</p>
      </section>

      <!-- ========== 预订摘要 ========== -->
      <section
        v-if="selectedSeat && selectedDateTime"
        class="bg-primary-light/30 rounded-2xl p-6 border border-primary/20"
      >
        <h3 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">预订摘要</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray">座位</span>
            <span class="font-medium text-gray-dark">{{ selectedSeat }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray">日期</span>
            <span class="font-medium text-gray-dark"
              >{{ selectedDateTime.date }} ({{ selectedDateTime.weekday }})</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray">时间</span>
            <span class="font-medium text-gray-dark">{{ selectedDateTime.time }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray">伙伴</span>
            <span class="font-medium text-gray-dark">{{ invitedPartners.length }} 人</span>
          </div>
          <div class="border-t border-primary/20 pt-3 mt-3"></div>
          <div class="flex justify-between items-center">
            <span class="text-gray">消耗积分</span>
            <div class="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="10" cy="10" r="9" fill="#51D5FF" />
                <path d="M10 6v8M6 10h8" stroke="white" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <span class="font-bold text-cyan text-lg">{{ coinCost }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ========== 底部固定操作栏 ========== -->
    <div class="fixed bottom-0 left-0 right-0 bg-white px-6 py-4 z-20 shadow-lg">
      <div class="flex justify-end max-w-2xl mx-auto">
        <div class="flex items-center gap-3 w-2/3">
          <div class="flex items-center gap-1.5 px-3 py-2 bg-cyan/10 rounded-xl flex-shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="#51D5FF" />
              <path d="M12 7v10M7 12h10" stroke="white" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="text-base font-bold text-cyan">{{ coinCost }}</span>
          </div>

          <button
            @click="bookNow"
            :disabled="!selectedSeat || isBookingLoading || isLoadingSeats"
            class="w-full py-4 text-lg font-bold text-white rounded-xl bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isBookingLoading ? 'Booking...' : 'Book Now' }}
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
    <SuccessModal v-model:visible="showSuccessModal" @back="backToHome" />
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
