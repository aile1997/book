<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'

const router = useRouter()

// --- 1. 数据层抽取 ---
const userProfile = ref({
  name: 'Alex Zhou',
  coins: 1200,
})

const invitation = ref({
  show: true,
  date: '2025.11.20',
  time: '13:00 - 18:00',
  seat: 'B4',
  partner: 'Elena Zhang',
})

const currentBooking = ref({
  date: '2025.11.20',
  time: '09:00 - 12:00',
  seat: 'A6',
  partners: [
    { name: 'Sally Feng', status: 'Confirmed' },
    { name: 'Eric Zhang', status: 'Pending' },
  ],
})

const transactions = ref([
  {
    date: '2025.11.19',
    items: [
      { desc: 'Transaction', amount: -200 },
      { desc: 'Transfer (to Elena Zhang)', amount: -300 },
    ],
  },
  {
    date: '2025.11.18',
    items: [
      { desc: 'Transaction', amount: -1500 },
      { desc: 'Redeem Coupon', amount: -200 },
      { desc: 'Transfer (from Tom Li)', amount: 200 },
    ],
  },
])

// --- 2. 状态控制 ---
const showPayModal = ref(false)
const showHistoryModal = ref(false)

const goBack = () => router.push('/')
const logout = () => {
  alert('Logged out')
  router.push('/')
}
const confirmInvitation = () => (invitation.value.show = false)
const rejectInvitation = () => (invitation.value.show = false)
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
        <h1 class="text-[32px] font-semibold leading-none">{{ userProfile.name }}</h1>
      </div>

      <div
        v-if="invitation.show"
        class="bg-white rounded-[10px] shadow-card p-5 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <h2 class="text-base font-semibold text-gray-dark mb-4">New Invitation</h2>
        <div class="space-y-3 mb-5">
          <div class="flex items-start gap-3">
            <div class="w-4 h-4 rounded-full bg-warning mt-1"></div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span>Date</span
                ><span class="text-sm font-medium text-gray-dark">{{ invitation.date }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span>Time</span
                ><span class="text-sm font-medium text-gray-dark">{{ invitation.time }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-400">Seat</span>
                <span class="text-2xl font-bold text-gray-dark leading-none">{{
                  invitation.seat
                }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <span>with</span
                ><span class="text-sm font-medium text-gray-dark">{{ invitation.partner }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="rejectInvitation"
            class="flex-1 py-2.5 rounded-lg border border-gray-100 text-sm font-medium text-gray-600"
          >
            Reject
          </button>
          <button
            @click="confirmInvitation"
            class="flex-1 py-2.5 rounded-lg bg-success text-sm font-medium text-white shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>

      <div class="bg-white rounded-[10px] shadow-card p-5 mb-4">
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
            class="px-6 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>

      <div class="bg-cyan rounded-[10px] p-5 mb-8 shadow-lg shadow-cyan/20">
        <h2 class="text-base font-semibold text-white mb-3">My Coins</h2>
        <div class="flex items-center gap-2 mb-6">
          <svg width="24" height="24" viewBox="0 0 27 27" fill="white">
            <path
              d="M13.1 0C5.8 0 0 5.8 0 13.1s5.8 13.1 13.1 13.1 13.1-5.8 13.1-13.1S20.3 0 13.1 0zm4.9 12.1H8.5v.3c0 1.6 1.3 2.9 2.9 2.9h6.6c.5 0 .9.4.9.9s-.4.9-.9.9h-6.6c-2.7 0-4.9-2.2-4.9-4.9v-2.6c0-2.7 2.2-4.9 4.9-4.9h6.6c.5 0 .9.4.9.9s-.4.9-.9.9h-6.6c-1.6 0-2.9 1.3-2.9 2.9v.3h9.5c.5 0 .9.4.9.9s-.4.9-.9.9z"
            />
          </svg>
          <span class="text-2xl font-bold text-white">{{ userProfile.coins }}</span>
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
            <div v-for="group in transactions" :key="group.date">
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
