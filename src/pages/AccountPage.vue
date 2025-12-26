<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'
import { useAuth } from '../composables/useAuth'
import { useBooking } from '../composables/useBooking'
import { useInvitations } from '../composables/useInvitations'
import { useToast } from '../composables/useToast'
import type { Invitation } from '../composables/useInvitations'

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
const {
  upcomingInvitations,
  isLoadingInvitations,
  startPolling,
  accept,
  decline,
} = useInvitations()

// 状态控制
const showPayModal = ref(false)
const showHistoryModal = ref(false)
const isCancelling = ref(false)

// 当前预订：取第一个预订作为当前预订
const currentBooking = computed(() => {
  if (bookings.value.length === 0) return null
  const booking = bookings.value[0]
  
  // 适配数据结构到旧的 UI 模板
  return {
    id: booking.id,
    date: booking.bookingDate, // 假设 bookingDate 是 YYYY-MM-DD
    time: booking.timeSlot.time, // 假设 timeSlot.time 是 'HH:MM - HH:MM'
    seat: booking.seat.seatNumber, // 假设 seat.seatNumber 是 'A6'
    partners: booking.partners.map(p => ({
      name: p.fullName,
      status: p.status, // 假设有 status 字段
    })),
  }
})

// 交易记录：适配数据结构到旧的 UI 模板
const adaptedTransactions = computed(() => {
  // 假设 transactions.value 是一个扁平的交易列表
  // 需要将其按日期分组
  const groups: { [date: string]: any[] } = {}
  
  transactions.value.forEach(t => {
    const date = t.transactionDate || '未知日期' // 假设有 transactionDate 字段
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push({
      desc: t.description || '交易',
      amount: t.amount || 0,
    })
  })
  
  // 转换为数组并按日期降序排序
  return Object.keys(groups).sort().reverse().map(date => ({
    date: date,
    items: groups[date],
  }))
})

// --- 生命周期和数据加载 ---
onMounted(() => {
  // 加载用户数据
  // user 数据在 useAuth 中已加载
  
  // 加载预订和交易数据
  loadBookings()
  loadUserCredits()
  loadUserTransactions()
  
  // 启动邀请轮询
  startPolling()
})

// --- 事件处理 ---
const goBack = () => router.push('/')
const logout = () => {
  signOut()
  router.push('/')
}

// 处理接受邀请
const handleAccept = async (invitation: Invitation) => {
  try {
    await accept(invitation.id)
    success('已接受邀请！')
  } catch (error) {
    showError('接受邀请失败，请重试')
  }
}

// 处理拒绝邀请
const handleDecline = async (invitation: Invitation) => {
  try {
    await decline(invitation.id)
    success('已拒绝邀请！')
  } catch (error) {
    showError('拒绝邀请失败，请重试')
  }
}

// 取消当前预订
const handleCancelBooking = async () => {
  if (!currentBooking.value || isCancelling.value) return
  
  if (!confirm('确定要取消当前预订吗？')) return
  
  isCancelling.value = true
  try {
    await removeBooking(currentBooking.value.id)
    success('预订已成功取消！')
  } catch (error) {
    showError('取消预订失败，请重试')
  } finally {
    isCancelling.value = false
  }
}

// 兼容旧的邀请处理函数 (现在使用 useInvitations)
const confirmInvitation = (invitation: Invitation) => handleAccept(invitation)
const rejectInvitation = (invitation: Invitation) => handleDecline(invitation)

// 获取第一个待处理的邀请（用于旧的 UI 模板）
const firstPendingInvitation = computed(() => {
  return upcomingInvitations.value.find(inv => inv.status === 'PENDING')
})

</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 w-full h-full">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/82bec9dbdda63618707f633af0c7c4829ba41636?width=1624"
        class="w-full h-full object-cover rotate-[-90deg] scale-150"
      />
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[12.5px]"></div>
    </div>

    <div class="relative z-10 px-8 py-16">
      <div class="flex items-start justify-between mb-28">
        <RockBundLogo color="#ffffff" />
        <button
          @click="goBack"
          class="w-[54px] h-[54px] rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 18L6 6M6 18L18 6" stroke="white" stroke-width="1.5" />
          </svg>
        </button>
      </div>

      <div class="mb-12 text-white">
        <div class="text-base font-medium mb-2 opacity-80">Morning,</div>
        <h1 class="text-[32px] font-semibold leading-none">{{ user?.fullName || user?.username || 'User' }}</h1>
      </div>

      <!-- 伙伴邀请列表 (兼容旧的单个邀请 UI) -->
      <div
        v-if="firstPendingInvitation"
        class="bg-white rounded-[10px] shadow-card p-5 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <h2 class="text-base font-semibold text-gray-dark mb-4">New Invitation</h2>
        <div class="space-y-3 mb-5">
          <div class="flex items-start gap-3">
            <div class="w-4 h-4 rounded-full bg-warning mt-1"></div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span>Date</span
                ><span class="text-sm font-medium text-gray-dark">{{ firstPendingInvitation.bookingDate }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span>Time</span
                ><span class="text-sm font-medium text-gray-dark">{{ firstPendingInvitation.timeSlot.time }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-400">Seat</span>
                <span class="text-2xl font-bold text-gray-dark leading-none">{{
                  firstPendingInvitation.seat.seatNumber
                }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <span>with</span
                ><span class="text-sm font-medium text-gray-dark">{{ firstPendingInvitation.inviter.fullName }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="rejectInvitation(firstPendingInvitation)"
            class="flex-1 py-2.5 rounded-lg border border-gray-100 text-sm font-medium text-gray-600"
          >
            Reject
          </button>
          <button
            @click="confirmInvitation(firstPendingInvitation)"
            class="flex-1 py-2.5 rounded-lg bg-success text-sm font-medium text-white shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>

      <!-- 当前预订 -->
      <div v-if="currentBooking" class="bg-white rounded-[10px] shadow-card p-5 mb-4">
        <h2 class="text-base font-semibold text-gray-dark mb-4">My Bookings</h2>
        <div class="flex items-start gap-3 mb-5">
          <div class="w-4 h-4 rounded-full bg-success mt-1 flex items-center justify-center">
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M0.35 2.2L3.43 5.35L8.35 0.35" stroke="white" stroke-width="1.2" />
            </svg>
          </div>
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <span>Date</span
              ><span class="text-sm font-medium text-gray-dark">{{ currentBooking.date }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <span>Time</span
              ><span class="text-sm font-medium text-gray-dark">{{ currentBooking.time }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-400">Seat</span>
              <span class="text-2xl font-bold text-gray-dark leading-none">{{
                currentBooking.seat
              }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap pt-1">
              <span>with</span>
              <template v-for="(p, i) in currentBooking.partners" :key="i">
                <span class="text-sm font-medium text-gray-dark">{{ p.name }}</span>
                <span v-if="p.status === 'Pending'" class="text-xs text-gray-300">(Pending)</span>
              </template>
            </div>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            @click="handleCancelBooking"
            :disabled="isCancelling"
            class="px-6 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-500"
          >
            {{ isCancelling ? 'Cancelling...' : 'Cancel' }}
          </button>
        </div>
      </div>

      <!-- 积分和历史记录 -->
      <div class="bg-cyan rounded-[10px] p-5 mb-8 shadow-lg shadow-cyan/20">
        <h2 class="text-base font-semibold text-white mb-3">My Coins</h2>
        <div class="flex items-center gap-2 mb-6">
          <svg width="24" height="24" viewBox="0 0 27 27" fill="white">
            <path
              d="M13.1 0C5.8 0 0 5.8 0 13.1s5.8 13.1 13.1 13.1 13.1-5.8 13.1-13.1S20.3 0 13.1 0zm4.9 12.1H8.5v.3c0 1.6 1.3 2.9 2.9 2.9h6.6c.5 0 .9.4.9.9s-.4.9-.9.9h-6.6c-2.7 0-4.9-2.2-4.9-4.9v-2.6c0-2.7 2.2-4.9 4.9-4.9h6.6c.5 0 .9.4.9.9s-.4.9-.9.9h-6.6c-1.6 0-2.9 1.3-2.9 2.9v.3h9.5c.5 0 .9.4.9.9s-.4.9-.9.9z"
            />
          </svg>
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
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/aaf4d9f822054bf79aa4464f55763b5e77b3e1fa?width=478"
              class="w-56 h-56"
            />
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
          <h3 class="text-white text-xl font-medium text-center mb-6">Account History</h3>

          <div class="overflow-y-auto flex-1 px-2 space-y-8">
            <div v-for="group in adaptedTransactions" :key="group.date">
              <div class="text-white/40 text-[10px] uppercase tracking-widest text-right mb-4">
                {{ group.date }}
              </div>
              <div class="space-y-4">
                <div
                  v-for="(item, idx) in group.items"
                  :key="idx"
                  class="flex justify-between items-center"
                >
                  <span class="text-white/90 text-sm">{{ item.desc }}</span>
                  <span
                    class="text-white font-semibold"
                    :class="item.amount > 0 ? 'text-white' : 'text-white/80'"
                  >
                    {{ item.amount > 0 ? '+' : '' }}{{ item.amount }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="showHistoryModal = false"
            class="mt-8 w-full py-4 border border-white/30 rounded-xl text-white font-medium"
          >
            Back
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
