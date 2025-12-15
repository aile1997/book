<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import InvitePartnerModal from '../components/InvitePartnerModal.vue'
import SuccessModal from '../components/SuccessModal.vue'

const router = useRouter()

// 时间段接口
interface TimeSlot {
  date: string
  displayDate: string
  times: { time: string; selected: boolean }[]
}

// 座位接口
interface Seat {
  id: string
  area: 'fitness' | 'lounge'
  row: number
  col: number
  status: 'available' | 'occupied' | 'invited'
}

// 选中的座位
const selectedSeat = ref<string>('')

// 邀请的伙伴列表
const invitedPartners = ref<string[]>(['Sally Feng', 'Eric Zhang'])

// Coins 消耗
const coinCost = ref(10)

// 模态框状态
const showInviteModal = ref(false)
const showSuccessModal = ref(false)

// 时间段数据（可以从API获取）
const timeSlots = ref<TimeSlot[]>([
  {
    date: '11.20',
    displayDate: '2025.11.20',
    times: [
      { time: '09:00 - 12:00', selected: true },
      { time: '13:00 - 18:00', selected: false },
    ],
  },
  {
    date: '11.21',
    displayDate: '2025.11.21',
    times: [
      { time: '09:00 - 12:00', selected: false },
      { time: '13:00 - 18:00', selected: false },
    ],
  },
])

// 座位数据（模拟真实数据，可从API获取）
const seats = ref<Seat[]>([
  // Fitness区域 - 左侧
  { id: 'A1', area: 'fitness', row: 0, col: 0, status: 'occupied' },
  { id: 'A2', area: 'fitness', row: 0, col: 1, status: 'occupied' },
  { id: 'A3', area: 'fitness', row: 1, col: 0, status: 'available' },
  { id: 'A4', area: 'fitness', row: 1, col: 1, status: 'invited' },
  { id: 'A5', area: 'fitness', row: 2, col: 0, status: 'available' },
  { id: 'A6', area: 'fitness', row: 2, col: 1, status: 'available' },
  { id: 'A7', area: 'fitness', row: 3, col: 0, status: 'available' },
  { id: 'A8', area: 'fitness', row: 3, col: 1, status: 'available' },
  
  // Lounge区域 - 右侧
  { id: 'B1', area: 'lounge', row: 0, col: 0, status: 'available' },
  { id: 'B2', area: 'lounge', row: 0, col: 1, status: 'available' },
  { id: 'B3', area: 'lounge', row: 1, col: 0, status: 'occupied' },
  { id: 'B4', area: 'lounge', row: 1, col: 1, status: 'available' },
  { id: 'B5', area: 'lounge', row: 2, col: 0, status: 'occupied' },
  { id: 'B6', area: 'lounge', row: 2, col: 1, status: 'invited' },
  { id: 'B7', area: 'lounge', row: 3, col: 0, status: 'occupied' },
  { id: 'B8', area: 'lounge', row: 3, col: 1, status: 'available' },
])

// 切换时间段选择
const toggleTimeSlot = (dateIndex: number, timeIndex: number) => {
  // 先取消所有选择
  timeSlots.value.forEach((slot, dIdx) => {
    slot.times.forEach((time, tIdx) => {
      time.selected = dIdx === dateIndex && tIdx === timeIndex
    })
  })
}

// 选择座位
const selectSeatHandler = (seatId: string) => {
  const seat = seats.value.find(s => s.id === seatId)
  if (seat && seat.status === 'available') {
    selectedSeat.value = seatId
  }
}

// 获取座位颜色
const getSeatColor = (seat: Seat) => {
  if (selectedSeat.value === seat.id) return '#292929'
  if (seat.status === 'available') return '#38D87B'
  if (seat.status === 'occupied') return '#B9B9B9'
  if (seat.status === 'invited') return '#BE9FF6'
  return '#B9B9B9'
}

// 移除邀请伙伴
const removePartner = (partner: string) => {
  invitedPartners.value = invitedPartners.value.filter(p => p !== partner)
}

// 打开邀请模态框
const openInviteModal = () => {
  showInviteModal.value = true
}

// 确认邀请
const confirmInvite = () => {
  showInviteModal.value = false
}

// 预定座位
const bookNow = () => {
  if (!selectedSeat.value) {
    alert('请先选择座位')
    return
  }
  showSuccessModal.value = true
}

// 返回首页
const goBack = () => {
  router.back()
}

// 从成功页返回首页
const backToHome = () => {
  router.push('/')
}

// 更改座位
const changeSeat = () => {
  selectedSeat.value = ''
}

// 获取指定区域和位置的座位
const getSeatByPosition = (area: 'fitness' | 'lounge', row: number, col: number) => {
  return seats.value.find(s => s.area === area && s.row === row && s.col === col)
}
</script>

<template>
  <div class="relative min-h-screen bg-white pb-24">
    <!-- 背景图 -->
    <div class="absolute inset-0 w-full h-full pointer-events-none">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/82bec9dbdda63618707f633af0c7c4829ba41636?width=1624"
        alt=""
        class="w-full h-full object-cover"
      />
    </div>

    <!-- 渐变遮罩 -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" style="top: 300px"></div>

    <!-- 主要内容 -->
    <div class="relative z-10">
      <!-- 顶部导航 -->
      <div class="flex items-center justify-center px-6 py-6 relative">
        <button
          @click="goBack"
          class="absolute left-6 flex items-center justify-center w-6 h-6"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <h1 class="text-xl font-medium text-black text-center leading-[100%]">Booking Seats</h1>
      </div>

      <!-- 座位地图（使用Figma原图） -->
      <div class="px-8 mb-6">
        <div class="relative">
          <img
            :src="selectedSeat ? 'https://api.builder.io/api/v1/image/assets/TEMP/2e0e9ed1ee7f0259364fc0b8ce38c39beff4d76c?width=436' : 'https://api.builder.io/api/v1/image/assets/TEMP/d93ebc6394f8f3ae3492ff3e1f3c80b9d2ea39f9?width=436'"
            alt="Seat Map"
            class="w-full max-w-[218px] mx-auto"
          />
        </div>

        <!-- 选择座位按钮 / 已选座位信息 -->
        <div v-if="!selectedSeat" class="flex justify-center mt-6">
          <button class="px-5 py-3.5 bg-gray-dark text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity leading-[100%] tracking-[-0.14px]">
            Select Seat
          </button>
        </div>

        <!-- 已选座位 -->
        <div v-else class="mt-6">
          <div class="flex items-end justify-between">
            <div>
              <div class="text-sm font-medium text-black mb-2 leading-[100%] tracking-[-0.14px]">
                Your Seat
              </div>
              <div class="text-4xl font-semibold text-black leading-[100%] tracking-[-0.36px]">
                {{ selectedSeat }}
              </div>
            </div>
            <button
              @click="changeSeat"
              class="px-8 py-3 border border-gray-light rounded-lg text-sm font-medium text-gray-dark hover:border-gray-dark transition-colors leading-[100%] tracking-[-0.14px]"
            >
              Change Seat
            </button>
          </div>
        </div>
      </div>

      <!-- 日期和时间 -->
      <div class="px-8 mb-6">
        <h2 class="text-sm font-medium text-black mb-4 leading-[100%] tracking-[-0.14px]">Date & Time</h2>
        
        <div class="space-y-3">
          <div
            v-for="(slot, dateIndex) in timeSlots"
            :key="dateIndex"
            class="flex gap-4"
          >
            <div class="text-2xl font-semibold text-gray-dark w-16 leading-[100%] tracking-[-0.24px]">
              {{ slot.date }}
            </div>
            <div class="flex-1 space-y-2">
              <button
                v-for="(time, timeIndex) in slot.times"
                :key="timeIndex"
                @click="toggleTimeSlot(dateIndex, timeIndex)"
                class="w-full px-3.5 py-3.5 rounded-[10px] text-sm font-medium transition-all leading-[100%] tracking-[-0.14px]"
                :class="[
                  time.selected
                    ? 'bg-success text-white'
                    : 'border border-gray-light text-gray-dark hover:border-gray-dark'
                ]"
              >
                {{ time.time }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邀请伙伴 -->
      <div class="px-8 mb-6">
        <h2 class="text-sm font-medium text-black mb-4 leading-[100%] tracking-[-0.14px]">Invite Partner</h2>
        
        <div class="flex flex-wrap gap-2">
          <!-- 已邀请的伙伴 -->
          <button
            v-for="partner in invitedPartners"
            :key="partner"
            @click="removePartner(partner)"
            class="inline-flex items-center gap-0.5 px-2 py-1 bg-primary-light rounded-full border border-primary"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 1.5C4.8675 1.5 1.5 4.8675 1.5 9C1.5 13.1325 4.8675 16.5 9 16.5C13.1325 16.5 16.5 13.1325 16.5 9C16.5 4.8675 13.1325 1.5 9 1.5ZM11.52 10.725C11.7375 10.9425 11.7375 11.3025 11.52 11.52C11.4075 11.6325 11.265 11.685 11.1225 11.685C10.98 11.685 10.8375 11.6325 10.725 11.52L9 9.795L7.275 11.52C7.1625 11.6325 7.02 11.685 6.8775 11.685C6.735 11.685 6.5925 11.6325 6.48 11.52C6.2625 11.3025 6.2625 10.9425 6.48 10.725L8.205 9L6.48 7.275C6.2625 7.0575 6.2625 6.6975 6.48 6.48C6.6975 6.2625 7.0575 6.2625 7.275 6.48L9 8.205L10.725 6.48C10.9425 6.2625 11.3025 6.2625 11.52 6.48C11.7375 6.6975 11.7375 7.0575 11.52 7.275L9.795 9L11.52 10.725Z"
                fill="#784DC7"
              />
            </svg>
            <span class="text-sm font-medium text-primary-dark leading-[100%] tracking-[-0.14px]">{{ partner }}</span>
          </button>
          
          <!-- 添加按钮 -->
          <button
            @click="openInviteModal"
            class="w-6 h-6 rounded-full border border-gray-light bg-white flex items-center justify-center hover:border-gray-dark transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 1V11M1 6H11"
                stroke="#B9B9B9"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 底部固定栏 -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-light px-8 py-4 z-20">
        <div class="flex items-center justify-between max-w-md mx-auto">
          <!-- Coins显示 -->
          <div class="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9.58333 0C4.29333 0 0 4.29333 0 9.58333C0 14.8733 4.29333 19.1667 9.58333 19.1667C14.8733 19.1667 19.1667 14.8733 19.1667 9.58333C19.1667 4.29333 14.8733 0 9.58333 0ZM13.1771 8.86458C13.57 8.86458 13.8958 9.19042 13.8958 9.58333C13.8958 9.97625 13.57 10.3021 13.1771 10.3021H6.22917V10.5417C6.22917 11.73 7.19708 12.6979 8.38542 12.6979H13.1771C13.57 12.6979 13.8958 13.0237 13.8958 13.4167C13.8958 13.8096 13.57 14.1354 13.1771 14.1354H8.38542C6.40167 14.1354 4.79167 12.5254 4.79167 10.5417V8.625C4.79167 6.64125 6.40167 5.03125 8.38542 5.03125H13.1771C13.57 5.03125 13.8958 5.35708 13.8958 5.75C13.8958 6.14292 13.57 6.46875 13.1771 6.46875H8.38542C7.19708 6.46875 6.22917 7.43667 6.22917 8.625V8.86458H13.1771Z"
                fill="#51D5FF"
              />
            </svg>
            <span class="text-sm font-medium text-cyan leading-[100%] tracking-[-0.14px]">{{ coinCost }}</span>
          </div>
          
          <!-- 预定按钮 -->
          <button
            @click="bookNow"
            class="px-8 py-3.5 bg-gray-dark text-white text-xl font-medium rounded-lg hover:opacity-90 transition-opacity leading-[100%] tracking-[-0.2px]"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>

    <!-- 邀请伙伴模态框 -->
    <InvitePartnerModal
      v-model:visible="showInviteModal"
      v-model:selected-partners="invitedPartners"
      @confirm="confirmInvite"
    />

    <!-- 成功模态框 -->
    <SuccessModal
      v-model:visible="showSuccessModal"
      @back="backToHome"
    />
  </div>
</template>
