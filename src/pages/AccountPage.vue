<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'

const router = useRouter()

const showNewInvitation = ref(true)
const showPayModal = ref(false)
const showHistoryModal = ref(false)

const goBack = () => {
  router.push('/')
}

const logout = () => {
  alert('Logged out')
  router.push('/')
}

const confirmInvitation = () => {
  showNewInvitation.value = false
}

const rejectInvitation = () => {
  showNewInvitation.value = false
}

const openPayModal = () => {
  showPayModal.value = true
}

const openHistoryModal = () => {
  showHistoryModal.value = true
}

const closePayModal = () => {
  showPayModal.value = false
}

const closeHistoryModal = () => {
  showHistoryModal.value = false
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 w-full h-full">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/82bec9dbdda63618707f633af0c7c4829ba41636?width=1624"
        alt=""
        class="w-full h-full object-cover rotate-[-90deg] scale-150"
      />
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[12.5px]"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 px-8 py-16">
      <!-- Header -->
      <div class="flex items-start justify-between mb-28">
        <RockBundLogo color="#ffffff" />

        <button
          @click="goBack"
          class="w-[54px] h-[54px] rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18 18L6 6" stroke="white" stroke-width="1.5" />
            <path d="M6 18L18 6" stroke="white" stroke-width="1.5" />
          </svg>
        </button>
      </div>

      <!-- Greeting -->
      <div class="mb-12">
        <div class="text-white text-base font-medium mb-2 tracking-tight">Morning,</div>
        <h1 class="text-white text-[32px] font-semibold leading-none tracking-tight">Alex Zhou</h1>
      </div>

      <!-- New Invitation (conditional) -->
      <div v-if="showNewInvitation" class="bg-white rounded-[10px] shadow-card p-5 mb-4">
        <h2 class="text-base font-semibold text-gray-dark mb-4">New Invitation</h2>

        <div class="space-y-2 mb-4">
          <div class="flex items-start gap-3">
            <div class="w-4 h-4 rounded-full bg-warning mt-0.5"></div>
            <div class="flex-1">
              <div class="flex items-center gap-2 text-xs text-gray-lighter mb-1">
                <span>Date</span>
                <span class="text-sm font-medium text-gray-dark">2025.11.20</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-lighter mb-3">
                <span>Time</span>
                <span class="text-sm font-medium text-gray-dark">13:00 - 18:00</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-lighter mb-1">
                <span>Seat</span>
              </div>
              <div class="text-2xl font-semibold text-gray-dark mb-3">B4</div>
              <div class="flex items-center gap-2 text-xs text-gray-lighter">
                <span>with</span>
                <span class="text-sm font-medium text-gray-dark">Elena Zhang</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="rejectInvitation"
            class="flex-1 px-4 py-2 rounded-lg border border-gray-light text-sm font-medium text-gray-dark hover:border-gray-dark transition-colors"
          >
            Reject
          </button>
          <button
            @click="confirmInvitation"
            class="flex-1 px-4 py-2 rounded-lg bg-success text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Confirm
          </button>
        </div>
      </div>

      <!-- My Bookings -->
      <div class="bg-white rounded-[10px] shadow-card p-5 mb-4">
        <h2 class="text-base font-semibold text-gray-dark mb-4">My Bookings</h2>

        <div class="space-y-2 mb-4">
          <div class="flex items-start gap-3">
            <div class="w-4 h-4 rounded-full bg-success mt-0.5 flex items-center justify-center">
              <svg
                width="8"
                height="6"
                viewBox="0 0 8 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.356445 2.22559L3.43337 5.35059L8.35645 0.350586"
                  stroke="white"
                  stroke-width="1"
                />
              </svg>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 text-xs text-gray-lighter mb-1">
                <span>Date</span>
                <span class="text-sm font-medium text-gray-dark">2025.11.20</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-lighter mb-3">
                <span>Time</span>
                <span class="text-sm font-medium text-gray-dark">09:00 - 12:00</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-lighter mb-1">
                <span>Seat</span>
              </div>
              <div class="text-2xl font-semibold text-gray-dark mb-3">A6</div>
              <div class="flex items-center gap-2 text-xs text-gray-lighter flex-wrap">
                <span>with</span>
                <span class="text-sm font-medium text-gray-dark">Sally Feng</span>
                <span class="text-sm font-medium text-gray-dark">Eric Zhang</span>
                <span class="text-sm font-medium text-gray-lighter">(Pending)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            class="px-6 py-2 rounded-lg border border-gray-light text-sm font-medium text-gray-dark hover:border-gray-dark transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- My Coins -->
      <div class="bg-cyan rounded-[10px] p-5 mb-8">
        <h2 class="text-base font-semibold text-white mb-3">My Coins</h2>

        <div class="flex items-center gap-2 mb-6">
          <svg
            width="27"
            height="27"
            viewBox="0 0 27 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.114 0C5.87509 0 0 5.87509 0 13.114C0 20.353 5.87509 26.2281 13.114 26.2281C20.353 26.2281 26.2281 20.353 26.2281 13.114C26.2281 5.87509 20.353 0 13.114 0ZM18.0318 12.1305C18.5695 12.1305 19.0154 12.5764 19.0154 13.114C19.0154 13.6517 18.5695 14.0976 18.0318 14.0976H8.52412V14.4254C8.52412 16.0516 9.84864 17.3761 11.4748 17.3761H18.0318C18.5695 17.3761 19.0154 17.822 19.0154 18.3596C19.0154 18.8973 18.5695 19.3432 18.0318 19.3432H11.4748C8.76018 19.3432 6.55702 17.14 6.55702 14.4254V11.8026C6.55702 9.08803 8.76018 6.88487 11.4748 6.88487H18.0318C18.5695 6.88487 19.0154 7.33075 19.0154 7.86842C19.0154 8.4061 18.5695 8.85197 18.0318 8.85197H11.4748C9.84864 8.85197 8.52412 10.1765 8.52412 11.8026V12.1305H18.0318Z"
              fill="white"
            />
          </svg>
          <span class="text-2xl font-medium text-white">1200</span>
        </div>

        <div class="flex gap-2">
          <button
            @click="openPayModal"
            class="flex-1 px-4 py-2 rounded-lg border border-white text-sm font-medium text-white text-center hover:bg-white/10 transition-colors"
          >
            Pay
          </button>
          <button
            @click="openHistoryModal"
            class="flex-1 px-4 py-2 rounded-lg border border-white text-sm font-medium text-white text-center hover:bg-white/10 transition-colors"
          >
            History
          </button>
        </div>
      </div>

      <!-- Log Out -->
      <div class="text-center">
        <button
          @click="logout"
          class="text-sm font-medium text-white hover:opacity-70 transition-opacity"
        >
          Log Out
        </button>
      </div>
    </div>

    <!-- Pay Modal -->
    <Transition name="fade">
      <div
        v-if="showPayModal"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[12.5px]"
        @click.self="closePayModal"
      >
        <div class="w-full max-w-md bg-cyan rounded-t-[45px] p-8 pb-12 animate-slide-up">
          <h3 class="text-white text-2xl font-medium text-center mb-8">Scan to pay</h3>

          <div class="bg-white rounded-lg p-6 mb-8 mx-auto w-fit">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/aaf4d9f822054bf79aa4464f55763b5e77b3e1fa?width=478"
              alt="QR Code"
              class="w-60 h-60"
            />
          </div>

          <button
            @click="closePayModal"
            class="w-full px-8 py-4 border-2 border-white rounded-lg text-white text-base font-medium hover:bg-white/10 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </Transition>

    <!-- History Modal -->
    <Transition name="fade">
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[12.5px]"
        @click.self="closeHistoryModal"
      >
        <div class="w-full max-w-md bg-cyan rounded-t-[45px] p-8 pb-12 animate-slide-up">
          <h3 class="text-white text-2xl font-medium text-center mb-4">Account History</h3>

          <div class="flex items-center justify-center gap-2 mb-8">
            <span class="text-white text-base font-medium">Balance</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM11 7.4C11.328 7.4 11.6 7.672 11.6 8C11.6 8.328 11.328 8.6 11 8.6H5.2V8.8C5.2 9.792 6.008 10.6 7 10.6H11C11.328 10.6 11.6 10.872 11.6 11.2C11.6 11.528 11.328 11.8 11 11.8H7C5.344 11.8 4 10.456 4 8.8V7.2C4 5.544 5.344 4.2 7 4.2H11C11.328 4.2 11.6 4.472 11.6 4.8C11.6 5.128 11.328 5.4 11 5.4H7C6.008 5.4 5.2 6.208 5.2 7.2V7.4H11Z"
                fill="white"
              />
            </svg>
            <span class="text-white text-base font-medium">1200</span>
          </div>

          <div class="border-t border-white/20 mb-4"></div>

          <!-- Transaction list -->
          <div class="space-y-6 mb-8">
            <!-- Date group 1 -->
            <div>
              <div class="text-white/60 text-xs tracking-wider text-right mb-3">2025.11.19</div>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-white text-base font-medium">Transaction</span>
                  <span class="text-white text-base font-medium">-200</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-white text-base font-medium">Transfer (to Elena Zhang)</span>
                  <span class="text-white text-base font-medium">-300</span>
                </div>
              </div>
            </div>

            <div class="border-t border-white/20"></div>

            <!-- Date group 2 -->
            <div>
              <div class="text-white/60 text-xs tracking-wider text-right mb-3">2025.11.18</div>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-white text-base font-medium">Transaction</span>
                  <span class="text-white text-base font-medium">-1500</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-white text-base font-medium">Redeem Coupon</span>
                  <span class="text-white text-base font-medium">-200</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-white text-base font-medium">Transfer (from Tom Li)</span>
                  <span class="text-white text-base font-medium">+200</span>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="closeHistoryModal"
            class="w-full px-8 py-4 border-2 border-white rounded-lg text-white text-base font-medium hover:bg-white/10 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
