<script setup lang="ts">
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/RockBundLogo.vue'

const router = useRouter()

const goBack = () => {
  router.push('/')
}

const logout = () => {
  alert('Logged out')
  router.push('/')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-[12.5px]">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/82bec9dbdda63618707f633af0c7c4829ba41636?width=1624"
        alt=""
        class="w-full h-full object-cover opacity-30"
      />
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 18L6 6" stroke="white" stroke-width="1.5"/>
            <path d="M6 18L18 6" stroke="white" stroke-width="1.5"/>
          </svg>
        </button>
      </div>

      <!-- Greeting -->
      <div class="mb-12">
        <div class="text-white text-base font-medium mb-2 tracking-tight">
          Morning,
        </div>
        <h1 class="text-white text-[32px] font-semibold leading-none tracking-tight">
          Alex Zhou
        </h1>
      </div>

      <!-- New Invitation -->
      <div class="bg-white rounded-[10px] shadow-card p-5 mb-4">
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
          <button class="flex-1 px-4 py-2 rounded-lg border border-gray-light text-sm font-medium text-gray-dark hover:border-gray-dark transition-colors">
            Reject
          </button>
          <button class="flex-1 px-4 py-2 rounded-lg border border-success bg-success text-sm font-medium text-white hover:opacity-90 transition-opacity">
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
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.356445 2.22559L3.43337 5.35059L8.35645 0.350586" stroke="white" stroke-width="1"/>
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
              <div class="flex items-center gap-2 text-xs text-gray-lighter">
                <span>with</span>
                <span class="text-sm font-medium text-gray-dark">Sally Feng</span>
                <span class="text-sm font-medium text-gray-dark">Eric Zhang</span>
                <span class="text-sm font-medium text-gray-lighter">(Pending)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button class="px-6 py-2 rounded-lg border border-gray-light text-sm font-medium text-gray-dark hover:border-gray-dark transition-colors">
            Cancel
          </button>
        </div>
      </div>

      <!-- My Coins -->
      <div class="bg-cyan rounded-[10px] p-5 mb-8">
        <h2 class="text-base font-semibold text-white mb-3">My Coins</h2>
        
        <div class="flex items-center gap-2 mb-6">
          <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M13.114 0C5.87509 0 0 5.87509 0 13.114C0 20.353 5.87509 26.2281 13.114 26.2281C20.353 26.2281 26.2281 20.353 26.2281 13.114C26.2281 5.87509 20.353 0 13.114 0ZM18.0318 12.1305C18.5695 12.1305 19.0154 12.5764 19.0154 13.114C19.0154 13.6517 18.5695 14.0976 18.0318 14.0976H8.52412V14.4254C8.52412 16.0516 9.84864 17.3761 11.4748 17.3761H18.0318C18.5695 17.3761 19.0154 17.822 19.0154 18.3596C19.0154 18.8973 18.5695 19.3432 18.0318 19.3432H11.4748C8.76018 19.3432 6.55702 17.14 6.55702 14.4254V11.8026C6.55702 9.08803 8.76018 6.88487 11.4748 6.88487H18.0318C18.5695 6.88487 19.0154 7.33075 19.0154 7.86842C19.0154 8.4061 18.5695 8.85197 18.0318 8.85197H11.4748C9.84864 8.85197 8.52412 10.1765 8.52412 11.8026V12.1305H18.0318Z"
              fill="white"
            />
          </svg>
          <span class="text-2xl font-medium text-white">1200</span>
        </div>

        <div class="flex gap-2">
          <button class="flex-1 px-4 py-2 rounded-lg border border-white text-sm font-medium text-white text-center hover:bg-white/10 transition-colors">
            Pay
          </button>
          <button class="flex-1 px-4 py-2 rounded-lg border border-white text-sm font-medium text-white text-center hover:bg-white/10 transition-colors">
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
  </div>
</template>
