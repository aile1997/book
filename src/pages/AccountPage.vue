<script setup lang="ts">
import NProgress from 'nprogress'
import { ref, computed, onMounted, onBeforeMount, onBeforeUnmount } from 'vue'
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

// 当前预订：取第一个预订作为展示用的当前预订
const currentBooking = computed(() => {
  if (!bookings.value || bookings.value.length === 0) return null
  const booking = bookings.value[0]

  // 适配新的多时段 API 数据格式
  // 如果有 timeSlotDetails，使用第一个时段的数据
  const timeSlotDetail = booking.timeSlotDetails && booking.timeSlotDetails.length > 0
    ? booking.timeSlotDetails[0]
    : null

  return {
    id: booking.id || booking.bookingId,
    date: timeSlotDetail?.bookingDate || booking.bookingDate,
    // 拼接开始和结束时间
    time: timeSlotDetail
      ? `${timeSlotDetail.startTime} - ${timeSlotDetail.endTime}`
      : (booking.timeSlot?.time || `${booking.startTime || ''} - ${booking.endTime || ''}`),
    seat: booking.seatNumber || booking.seat,
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
    success('Has accepted the invitation！')
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
    success('Has declined the invitation！')
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
            'animate-in fade-in slide-in-from-bottom-4 duration-500',
            /* 3. 多条记录之间的明显分隔线：2px粗度，浅灰色，保持视觉连续性 */
            index !== 0 ? 'mt-5 pt-5 border-t-2 border-gray-100' : '',
          ]"
        >
          <div class="space-y-3 mb-3">
            <div class="flex items-start gap-3">
              <div class="w-4 h-4 rounded-full bg-warning mt-1 shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2 text-xs text-gray-400">
                  <span>Date</span>
                  <span class="text-sm font-medium text-gray-dark">{{
                    invitation.bookingDate
                  }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400">
                  <span>Time</span>
                  <span class="text-sm font-medium text-gray-dark">{{
                    invitation.timeSlot.time
                  }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">Seat</span>
                  <span class="text-2xl font-bold text-gray-dark leading-none">{{
                    invitation.seat.seatNumber
                  }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 pt-1">
                  <span>with</span>
                  <span class="text-sm font-medium text-gray-dark">{{
                    invitation.inviter.fullName
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="rejectInvitation(invitation)"
              class="flex-1 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-600"
            >
              Reject
            </button>
            <button
              @click="confirmInvitation(invitation)"
              class="flex-1 py-2 rounded-lg bg-success text-sm font-medium text-white shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      <!-- 我的预订（合并卡片展示） -->
      <div
        v-if="validBookings && validBookings.length > 0"
        class="bg-white rounded-[24px] shadow-card p-6 mb-6"
      >
        <h2 class="text-lg font-bold text-gray-dark mb-6">My Bookings</h2>

        <div
          v-for="(booking, index) in validBookings"
          :key="booking.id"
          :class="[
            'flex flex-col',
            index !== 0 ? 'mt-8 pt-8 border-t border-gray-100' : '',
          ]"
        >
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span class="text-2xl font-black text-primary">{{ booking.seatNumber || booking.seat }}</span>
              </div>
              <div>
                <div class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Seat</div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span class="text-sm font-bold text-gray-dark">Confirmed</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="() => handleChangeBooking(booking)"
                :disabled="isBookingExpiredForBooking(booking)"
                class="p-2.5 bg-gray-50 text-gray-dark rounded-xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-30"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 1L21 5L17 9M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21M7 23L3 19L7 15M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button
                @click="() => handleCancelBooking(booking.id || booking.bookingId)"
                :disabled="isCancelling || isBookingExpiredForBooking(booking)"
                class="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95 disabled:opacity-30"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <div class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Time Slots</div>
              <div class="grid grid-cols-2 gap-3">
                <template v-if="booking.timeSlotDetails && booking.timeSlotDetails.length > 0">
                  <div
                    v-for="slot in booking.timeSlotDetails"
                    :key="slot.id"
                    class="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col"
                  >
                    <span class="text-xs font-bold text-gray-dark">{{ slot.bookingDate }}</span>
                    <span class="text-xs text-gray-400">{{ slot.startTime }} - {{ slot.endTime }}</span>
                  </div>
                </template>
                <template v-else>
                  <div class="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col">
                    <span class="text-xs font-bold text-gray-dark">{{ booking.bookingDate }}</span>
                    <span class="text-xs text-gray-400">{{ booking.startTime }} - {{ booking.endTime }}</span>
                  </div>
                </template>
              </div>
            </div>

            <div v-if="booking.partners && booking.partners.length > 0">
              <div class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Partners</div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="p in booking.partners"
                  :key="p.id"
                  class="px-3 py-1.5 bg-success/10 text-success text-xs font-bold rounded-xl"
                >
                  {{ p.partnerName || p.fullName || p.username }}
                  <span v-if="p.invitationStatus === 'PENDING'" class="opacity-60 font-normal ml-1">(Pending)</span>
                </span>
              </div>
            </div>

            <!-- 提示语 -->
            <div class="pt-4 border-t border-gray-50 flex items-center gap-2 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-[10px] font-medium uppercase tracking-wider">操作同时对所有预订档期生效</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 积分和历史记录 -->
      <div class="bg-cyan rounded-[10px] p-5 mb-8 shadow-lg shadow-cyan/20">
        <h2 class="text-base font-semibold text-white mb-3">My Coins</h2>
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
            <div v-for="(group, gIdx) in adaptedTransactions" :key="group.date">
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
