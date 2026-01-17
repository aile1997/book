<script setup lang="ts">
import NProgress from 'nprogress'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/layout/RockBundLogo.vue'
import { useAuth } from '../composables/useAuth'
import { useBooking } from '../composables/useBooking'
import { useInvitations } from '../composables/useInvitations'
import { useToast } from '../composables/useToast'
import { isBookingExpired } from '../utils/time' // 引入公共函数
import type { Invitation } from '../composables/useInvitations'
import ConfirmModal from '../components/modals/ConfirmModal.vue'

const router = useRouter()
const { success, error: showError } = useToast()

// --- 1. 数据层抽取 ---
const { user, signOut } = useAuth()
const {
  bookings,
  transactions,
  coins,
  loadBookings,
  loadUserCredits,
  loadUserTransactions,
  removeBooking,
} = useBooking()
const { upcomingInvitations, startPolling, fetchInvitations, accept, decline } = useInvitations()

const userData = computed(() => {
  const hour = new Date().getHours()

  // 1. 极简时间判断：使用三元表达式或映射
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

  // 2. 直接返回：通过可选链确保响应式追踪
  // 这里的 user.value 只要在 App.vue 接口返回后更新，这里会自动重新计算
  return {
    name: user.value?.fullName || user.value?.name || '...',
    greeting,
  }
})

// 状态控制
const showPayModal = ref(false)
const showHistoryModal = ref(false)
const isCancelling = ref(false)
const showConfirmModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  onConfirm: () => {},
})

const currentBooking = computed(() => {
  if (!bookings.value || bookings.value.length === 0) return null
  const booking = bookings.value[0]

  // 适配新的多时段 API 数据格式
  // seatNumber 现在在 timeSlotDetails 数组中
  const timeSlotDetail =
    booking.timeSlotDetails && booking.timeSlotDetails.length > 0
      ? booking.timeSlotDetails[0]
      : null

  // 从 timeSlotDetails 中提取座位号
  const seatNumber = timeSlotDetail?.seatNumber || booking.seatNumber || ''

  return {
    id: booking.id || booking.bookingId,
    date: timeSlotDetail?.bookingDate || booking.bookingDate,
    // 拼接开始和结束时间
    time: timeSlotDetail
      ? `${timeSlotDetail.startTime} - ${timeSlotDetail.endTime}`
      : `${booking.startTime || ''} - ${booking.endTime || ''}`,
    seat: seatNumber,
    timeSlotId: timeSlotDetail?.timeSlotId || booking.timeSlotId,
    // 映射合作伙伴
    partners: (booking.partners || []).map((p: any) => ({
      name: p.partnerName || p.fullName || p.username,
      status: p.invitationStatus || p.status || 'PENDING',
    })),
  }
})

// 交易记录：适配数据结构，按日期和时间段分组
const adaptedTransactions = computed(() => {
  const groups: { [key: string]: any[] } = {}

  transactions.value.forEach((t) => {
    // 从 description 中提取日期和时间段，例如 "预订座位 A-01 于 2026-01-06 下午时段"
    // 匹配格式：YYYY-MM-DD 和 XX时段
    const dateMatch = t.description?.match(/\d{4}-\d{2}-\d{2}/)
    const slotMatch = t.description?.match(/[上下]午时段/)

    const date = dateMatch ? dateMatch[0] : t.createdAt ? t.createdAt.split('T')[0] : 'Unknown Date'
    const slot = slotMatch ? slotMatch[0] : ''

    // 组合键：日期 + 下划线 + 时间段
    const key = slot ? `${date} ` : date

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push({
      desc: t.description || 'Transaction',
      amount: t.amount || 0,
      id: t.id,
    })
  })

  // 按 ID 降序排序（通常 ID 越大越新）
  return Object.keys(groups)
    .sort((a, b) => {
      // 提取日期进行比较
      const dateA = a.split(' _ ')[0]
      const dateB = b.split(' _ ')[0]
      return dateB.localeCompare(dateA)
    })
    .map((key) => ({
      date: key,
      items: groups[key],
    }))
})

// --- 生命周期和数据加载 ---
onMounted(async () => {
  try {
    // 加载预订和交易数据

    loadUserCredits()
    loadUserTransactions()
    await loadBookings()
    await fetchInvitations()
    // 启动邀请轮询
    startPolling()
  } catch (error) {
    console.error('页面数据初始化失败:', error)
  } finally {
    NProgress.done()
  }
})

// --- 事件处理 ---
const goBack = () => router.push('/')

// 辅助函数：判断预订是否过期（适配多时段数据）
const isBookingExpiredForBooking = (booking: any) => {
  // 如果有 timeSlotDetails，检查第一个时段
  if (booking.timeSlotDetails && booking.timeSlotDetails.length > 0) {
    const firstSlot = booking.timeSlotDetails[0]
    return isBookingExpired(firstSlot.bookingDate, firstSlot.startTime)
  }
  // 兼容旧格式
  return isBookingExpired(booking.bookingDate, booking.startTime)
}

const handleChangeBooking = (booking: any) => {
  if (isBookingExpiredForBooking(booking)) {
    showError('This booking has started or expired.')
    return
  }

  // 获取正确的日期和时段ID
  const bookingDate = booking.timeSlotDetails?.[0]?.bookingDate || booking.bookingDate
  const timeSlotId = booking.timeSlotDetails?.[0]?.timeSlotId || booking.timeSlotId

  router.push({
    path: '/booking',
    query: {
      date: bookingDate,
      slotId: String(timeSlotId),
    },
  })
}

const logout = () => {
  confirmModalConfig.value = {
    title: 'Log Out',
    message: 'Are you sure you want to log out of your account?',
    onConfirm: () => {
      signOut()
      router.push('/')
    },
  }
  showConfirmModal.value = true
}

// 处理接受邀请
const handleAccept = async (invitation: Invitation) => {
  try {
    await accept(invitation.id)
    success('Invitation accepted successfully')
    // 刷新预订列表
    await loadBookings()
  } catch (error) {
    showError(error.message)
  }
}

// 处理拒绝邀请
const handleDecline = async (invitation: Invitation) => {
  try {
    await decline(invitation.id)
    success('Invitation declined successfully')
    // 不需要刷新预订列表
  } catch (error) {
    showError(error.message)
  }
}

// 取消当前预订
const handleCancelBooking = async (bookingId: number) => {
  if (!currentBooking.value || isCancelling.value) return

  confirmModalConfig.value = {
    title: 'Cancel Booking',
    message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
    onConfirm: async () => {
      isCancelling.value = true
      try {
        await removeBooking(bookingId)
        success('Reservation has been successfully cancelled！')
        // 刷新积分
        await loadUserCredits()
      } catch (error: any) {
        showError(error.message)
      } finally {
        isCancelling.value = false
      }
    },
  }
  showConfirmModal.value = true
}

// 兼容旧的邀请处理函数 (现在使用 useInvitations)
const confirmInvitation = (invitation: Invitation) => handleAccept(invitation)
const rejectInvitation = (invitation: Invitation) => handleDecline(invitation)

// 获取待处理的邀请（最多2个）
const pendingInvitations = computed(() => {
  return upcomingInvitations.value.filter((inv) => inv.status === 'PENDING') // 最多显示4个
})

// 获取有效的预订（最多2个）
const validBookings = computed(() => {
  return bookings.value // 最多显示2个
})

// 获取星期几的简写
const getDayOfWeek = (dateStr: string) => {
  if (!dateStr) return ''
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? '' : days[date.getDay()]
}

// 格式化日期显示（例如 "01.10 MON"）
const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}

// 按日期分组时段（用于 My Bookings 显示）
const groupTimeSlotsByDate = (timeSlotDetails: any[] | undefined) => {
  if (!timeSlotDetails || timeSlotDetails.length === 0) return {}

  const map: Record<string, any[]> = {}
  timeSlotDetails.forEach((slot) => {
    const displayDate = formatDateDisplay(slot.bookingDate)
    if (!map[displayDate]) {
      map[displayDate] = []
    }
    map[displayDate].push(slot)
  })
  return map
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden AccountPage">
    <div class="absolute inset-0 w-full h-full">
      <div
        class="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-transparent backdrop-blur-[12.5px]"
      ></div>
    </div>

    <div class="relative z-10 px-8 py-16">
      <div class="flex items-start justify-between mb-28">
        <RockBundLogo color="#ffffff" />
        <button
          @click="goBack"
          class="w-[54px] h-[54px] rounded-full bg-[#323232] flex items-center justify-center hover:opacity-90"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 18L6 6M6 18L18 6" stroke="white" stroke-width="1.5" />
          </svg>
        </button>
      </div>

      <div class="mb-12 text-white">
        <div class="text-base font-medium mb-2 opacity-80">{{ userData.greeting }},</div>
        <h1 class="text-[32px] font-semibold leading-none">
          {{ userData.name }}
        </h1>
      </div>

      <!-- 伙伴邀请列表（最多2个） -->
      <div
        v-if="pendingInvitations && pendingInvitations.length > 0"
        class="bg-white rounded-[10px] shadow-card p-5 mb-4"
      >
        <h2 class="text-base font-semibold text-gray-dark mb-4">New Invitation</h2>

        <div
          v-for="(invitation, index) in pendingInvitations"
          :key="invitation.id"
          :class="[
            'flex flex-col',
            /* index !== 0 表示从第二个邀请开始，上方增加明显的分隔线 */
            index !== 0 ? 'mt-5 pt-5 border-t-2 border-gray-100' : '',
          ]"
        >
          <div class="flex items-start gap-3 mb-2">
            <!-- 状态图标：Pending（时钟图标） -->
            <div
              class="w-4 h-4 rounded-full bg-warning mt-1 flex items-center justify-center shrink-0"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="3" stroke="white" stroke-width="0.8" />
                <path d="M4 2v2h1.5" stroke="white" stroke-width="0.8" stroke-linecap="round" />
              </svg>
            </div>

            <div class="flex-1 space-y-3">
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-400">Seat</span>
                <span class="text-2xl font-bold text-gray-dark leading-none">{{
                  invitation.timeSlotDetails[0].seatNumber
                }}</span>
              </div>

              <!-- 适配多时段数据：按日期分组显示时段 -->
              <!-- 假设 invitation.timeSlotDetails 存在，否则回退到单时段显示 -->
              <template
                v-if="
                  (invitation as any).timeSlotDetails &&
                  (invitation as any).timeSlotDetails.length > 0
                "
              >
                <div
                  v-for="(slotsByDate, dateLabel, index) in groupTimeSlotsByDate(
                    (invitation as any).timeSlotDetails,
                  )"
                  :key="dateLabel"
                  class="flex items-start mb-2 last:mb-0 gap-3"
                >
                  <div class="shrink-0">
                    <span
                      v-if="index === 0"
                      class="text-[10px] font-medium tracking-widest text-gray-400"
                    >
                      Date
                    </span>
                  </div>

                  <div class="flex-1 flex justify-between items-start">
                    <div class="flex items-center gap-2">
                      <span class="text-base font-medium text-gray-dark">
                        {{ dateLabel.split(' ')[0] }}
                      </span>
                      <span
                        class="px-1.2 py-0.2 rounded bg-gray-100 text-[8px] text-gray-500 font-medium"
                      >
                        {{ dateLabel.split(' ')[1] }}
                      </span>
                    </div>

                    <div class="flex flex-col items-end gap-0.5 mt-[1px]">
                      <span
                        v-for="(slot, idx) in slotsByDate"
                        :key="idx"
                        class="text-sm font-medium text-gray-dark tracking-tighter"
                      >
                        {{ slot.startTime }}-{{ slot.endTime }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <!-- 单时段显示（兼容旧格式） -->
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[10px] font-medium tracking-widest text-gray-400 w-8 shrink-0">
                    Date
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-base font-medium text-gray-dark">{{
                      formatDateDisplay(invitation.bookingDate).split(' ')[0]
                    }}</span>
                    <span
                      class="px-1.2 py-0.2 rounded bg-warning/10 text-[8px] text-warning font-medium"
                    >
                      {{ formatDateDisplay(invitation.bookingDate).split(' ')[1] }}
                    </span>
                  </div>
                  <span class="text-sm font-medium text-gray-dark tracking-tighter">{{
                    invitation.timeSlot.time
                  }}</span>
                </div>
              </template>

              <div class="flex items-center gap-3 text-xs text-gray-400">
                <span class="text-gray-400 text-[11px] tracking-wider shrink-0">From</span>
                <span class="text-sm font-medium text-gray-dark">{{
                  invitation.inviter.fullName
                }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="rejectInvitation(invitation)"
              class="flex-1 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 border-gray-100 text-gray-600 hover:bg-gray-50"
            >
              Reject
            </button>
            <button
              @click="confirmInvitation(invitation)"
              class="flex-1 py-2 rounded-lg bg-success text-sm font-medium text-white shadow-sm hover:bg-success/90 transition-all active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      <!-- 我的预订（最多2个） -->
      <div
        v-if="validBookings && validBookings.length > 0"
        class="bg-white rounded-[10px] shadow-card p-5 mb-4"
      >
        <h2 class="text-base font-semibold text-gray-dark mb-4">My Bookings</h2>

        <div
          v-for="(booking, index) in validBookings"
          :key="booking.id"
          :class="[
            'flex flex-col',
            /* index !== 0 表示从第二个预订开始，上方增加明显的分隔线 */
            index !== 0 ? 'mt-5 pt-5 border-t-2 border-gray-100' : '',
          ]"
        >
          <div class="flex items-start gap-3 mb-2">
            <div
              class="w-4 h-4 rounded-full bg-success mt-1 flex items-center justify-center shrink-0"
            >
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M0.35 2.2L3.43 5.35L8.35 0.35" stroke="white" stroke-width="1.2" />
              </svg>
            </div>

            <div class="flex-1 space-y-3">
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-400">Seat</span>
                <span class="text-2xl font-bold text-gray-dark leading-none">
                  {{ booking.timeSlotDetails?.[0]?.seatNumber || booking.seatNumber || '--' }}
                </span>
              </div>

              <!-- 适配多时段数据：按日期分组显示时段 -->
              <template v-if="booking.timeSlotDetails && booking.timeSlotDetails.length > 0">
                <!-- 按日期分组显示 -->
                <div
                  v-for="(slotsByDate, dateLabel, index) in groupTimeSlotsByDate(
                    booking.timeSlotDetails,
                  )"
                  :key="dateLabel"
                  class="flex items-start mb-2 last:mb-0 gap-3"
                >
                  <div class="shrink-0">
                    <span
                      v-if="index === 0"
                      class="text-[10px] font-medium tracking-widest text-gray-400"
                    >
                      Date
                    </span>
                  </div>

                  <div class="flex-1 flex justify-between items-start">
                    <div class="flex items-center gap-2">
                      <span class="text-base font-medium text-gray-dark">
                        {{ dateLabel.split(' ')[0] }}
                      </span>
                      <span
                        class="px-1.2 py-0.2 rounded bg-gray-100 text-[8px] text-gray-500 font-medium"
                      >
                        {{ dateLabel.split(' ')[1] }}
                      </span>
                    </div>

                    <div class="flex flex-col items-end gap-0.5 mt-[1px]">
                      <span
                        v-for="(slot, idx) in slotsByDate"
                        :key="idx"
                        class="text-sm font-medium text-gray-dark tracking-tighter"
                      >
                        {{ slot.startTime }}-{{ slot.endTime }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <!-- 单时段显示（兼容旧格式） -->
                <div class="flex items-center justify-between text-xs text-gray-400">
                  <span class="text-sm font-medium text-gray-dark">{{ booking.bookingDate }}</span>
                  <span class="text-sm font-medium text-gray-dark">
                    {{ booking.startTime }} - {{ booking.endTime }}
                  </span>
                </div>
              </template>

              <div
                v-if="booking.partners && booking.partners.length > 0"
                class="flex items-center gap-3 text-xs text-gray-400 flex-wrap"
              >
                <span class="text-gray-400 text-[11px] tracking-wider shrink-0"> With </span>
                <template v-for="(p, i) in booking.partners" :key="p.id">
                  <span class="text-sm font-medium text-gray-dark">{{
                    (p as any).partnerName || p.fullName || p.username
                  }}</span>
                  <!-- 状态图标 - 优化为更明显的样式 -->
                  <span
                    v-if="p.invitationStatus === 'PENDING'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning/10"
                    title="Pending"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <circle
                        cx="6"
                        cy="6"
                        r="5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        class="text-warning"
                      />
                      <path
                        d="M6 3v3h1.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        class="text-warning"
                      />
                    </svg>
                    <span class="text-[9px] font-medium text-warning leading-none">Pending</span>
                  </span>
                  <span
                    v-else-if="p.invitationStatus === 'ACCEPTED'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10"
                    title="Accepted"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3L10 4"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-success"
                      />
                    </svg>
                    <span class="text-[9px] font-medium text-success leading-none">Accepted</span>
                  </span>
                  <span
                    v-else-if="p.invitationStatus === 'DECLINED'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10"
                    title="Declined"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M3 3l6 6M9 3l-6 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        class="text-red-500"
                      />
                    </svg>
                    <span class="text-[9px] font-medium text-red-500 leading-none">Declined</span>
                  </span>
                  <span
                    v-else-if="p.invitationStatus === 'EXPIRED'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-200"
                    title="Expired"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <circle
                        cx="6"
                        cy="6"
                        r="5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        class="text-gray-400"
                      />
                      <path
                        d="M6 4v2M6 8h.01"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        class="text-gray-400"
                      />
                    </svg>
                    <span class="text-[9px] font-medium text-gray-400 leading-none">Expired</span>
                  </span>
                  <span v-if="i < booking.partners.length - 1" class="mx-0.5">,</span>
                </template>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="() => handleCancelBooking(booking.id || booking.bookingId)"
              :disabled="isCancelling || isBookingExpiredForBooking(booking)"
              class="flex-1 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95"
              :class="[
                isBookingExpiredForBooking(booking)
                  ? 'border-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-gray-100 text-gray-600 hover:bg-gray-50',
              ]"
            >
              {{ isCancelling ? 'Cancelling...' : 'Cancel' }}
            </button>
            <button
              @click="() => handleChangeBooking(booking)"
              :disabled="isBookingExpiredForBooking(booking)"
              class="flex-1 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95"
              :class="[
                isBookingExpiredForBooking(booking)
                  ? 'border-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-gray-100 text-gray-600 hover:bg-gray-50',
              ]"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      <!-- 积分和历史记录 -->
      <div class="bg-cyan rounded-[10px] p-5 mb-8 shadow-lg shadow-cyan/20">
        <h2 class="text-base font-semibold text-white mb-2">My Coins</h2>
        <div class="flex items-center gap-2 mb-6">
          <img src="@/assets/images/home/Vector1.png" alt="" class="w-5 h-5" />
          <span class="text-2xl font-bold text-white">{{ coins }}</span>
        </div>
        <div class="flex gap-2">
          <button
            @click="showPayModal = true"
            class="flex-1 py-2 rounded-lg border border-white/50 text-sm font-medium text-white hover:bg-white/10"
          >
            Pay
          </button>
          <button
            @click="showHistoryModal = true"
            class="flex-1 py-2 rounded-lg border border-white/50 text-sm font-medium text-white hover:bg-white/10"
          >
            History
          </button>
        </div>
      </div>

      <div class="text-center pb-8">
        <button
          @click="logout"
          class="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showPayModal"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showPayModal = false"
      >
        <div class="w-full max-w-md bg-cyan rounded-t-[40px] p-8 pb-12 animate-slide-up">
          <h3 class="text-white text-xl font-medium text-center mb-8">Scan to pay</h3>
          <div class="bg-white rounded-2xl p-6 mb-8 mx-auto w-fit shadow-inner">
            <img src="@/assets/images/account/erweima.png" class="w-56 h-56" alt="" />
          </div>
          <button
            @click="showPayModal = false"
            class="w-full py-4 border border-white/30 rounded-xl text-white font-medium"
          >
            Back
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showHistoryModal = false"
      >
        <div
          class="w-full max-w-md bg-cyan rounded-t-[40px] p-8 pb-12 animate-slide-up h-[80vh] flex flex-col"
        >
          <h3 class="text-white text-[28px] font-medium text-center mb-2">Account History</h3>
          <div class="flex items-center justify-center gap-2">
            <span class="text-white/80 text-lg font-bold">Balance</span>
            <div class="flex items-center gap-1.5">
              <img src="@/assets/images/home/Vector (1).png" alt="" class="w-5 h-5" />
              <span class="text-white text-lg font-bold">{{ coins }}</span>
            </div>
          </div>

          <div class="overflow-y-auto flex-1 px-2">
            <div v-for="group in adaptedTransactions" :key="group.date">
              <!-- 分隔线：除了第一组外，每组上方显示 -->
              <div class="border-t border-white/50 my-6"></div>

              <div class="text-white/60 text-xs text-right mb-4 font-medium tracking-wider">
                {{ group.date }}
              </div>
              <div class="space-y-5">
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  class="flex justify-between items-center"
                >
                  <span class="text-white text-base font-medium opacity-90 text-[15px]">{{
                    item.desc
                  }}</span>
                  <span class="text-white text-lg font-semibold text-[15px]">
                    {{ item.amount > 0 ? '+' : '' }}{{ item.amount }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10 px-10">
            <button
              @click="showHistoryModal = false"
              class="w-full py-3.5 border-2 border-white/60 rounded-[18px] text-white text-lg font-medium hover:bg-white/10 transition-colors active:scale-95"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 确认模态框 -->
    <ConfirmModal
      v-model:visible="showConfirmModal"
      :title="confirmModalConfig.title"
      :message="confirmModalConfig.message"
      @confirm="confirmModalConfig.onConfirm"
    />
  </div>
</template>

<style>
.AccountPage {
  overscroll-behavior-y: auto !important;
}
</style>
