<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSeats } from '../composables/useSeats'
import SeatMap from '../components/SeatMap.vue'
import FindPartnerModal from '../components/FindPartnerModal.vue'
import SeatSelectionModal from '../components/SeatSelectionModal.vue'
import SuccessModal from '../components/SuccessModal.vue'
import type { TimeSlot, Partner } from '../types/booking'

const router = useRouter()

// 使用座位管理组合式函数
const { seats, selectedSeat, selectSeat, clearSelection } = useSeats()

// ========== 状态管理 ==========

// 邀请的伙伴列表
const invitedPartners = ref<string[]>([])

// Coins 消耗
const coinCost = ref(10)

// 模态框状态
const showSeatModal = ref(false)
const showFindPartnerModal = ref(false)
const showSuccessModal = ref(false)

// 高亮显示的伙伴（用于在座位图上显示tooltip）
const highlightedPartner = ref<{ name: string; seat: string } | null>(null)

// ========== 时间段数据 ==========

const timeSlots = ref<TimeSlot[]>([
  {
    id: '1',
    date: '11.20',
    weekday: 'Wed.',
    times: [
      { id: '1-1', time: '09:00 - 12:00', selected: true },
      { id: '1-2', time: '12:00 - 18:00', selected: false },
    ],
  },
  {
    id: '2',
    date: '11.21',
    weekday: 'Thu.',
    times: [
      { id: '2-1', time: '09:00 - 12:00', selected: false },
      { id: '2-2', time: '12:00 - 18:00', selected: false },
    ],
  },
])

// 当前选中的日期和时间
const selectedDateTime = computed(() => {
  for (const slot of timeSlots.value) {
    const selectedTime = slot.times.find((t) => t.selected)
    if (selectedTime) {
      return {
        date: slot.date,
        weekday: slot.weekday,
        time: selectedTime.time,
      }
    }
  }
  return null
})

// ========== 事件处理函数 ==========

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
}

// 打开座位选择模态框
const openSeatModal = () => {
  showSeatModal.value = true
}

// 选择座位（从模态框）
const handleSeatSelect = (seatId: string) => {
  selectSeat(seatId)
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
const removePartner = (partner: string) => {
  invitedPartners.value = invitedPartners.value.filter((p) => p !== partner)
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
      seat: partner.seat
    }
  }
  showFindPartnerModal.value = false
}

// 清除高亮
const clearHighlight = () => {
  highlightedPartner.value = null
}

// 预定座位
const bookNow = () => {
  if (!selectedSeat.value) {
    alert('请先选择座位')
    return
  }
  if (!selectedDateTime.value) {
    alert('请选择日期和时间')
    return
  }
  // 显示成功模态框
  showSuccessModal.value = true
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
  <div class="relative min-h-screen bg-gradient-to-b from-gray-100 to-white">
    <!-- ========== 顶部导航栏 ========== -->
    <div class="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-light">
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
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">选择座位</h2>

        <!-- 未选择座位时显示地图预览 -->
        <div v-if="!selectedSeat" class="relative">
          <div class="opacity-60 pointer-events-none">
            <SeatMap :seats="seats" :selected-seat="null" @select-seat="() => {}" />
          </div>

          <!-- 选择按钮覆层 -->
          <div class="absolute inset-0 flex items-center justify-center">
            <button
              @click="openSeatModal"
              class="px-8 py-4 bg-gray-dark text-white text-base font-medium rounded-xl shadow-lg hover:bg-gray-dark/90 transition-all transform hover:scale-105"
            >
              Select Seat
            </button>
          </div>
        </div>

        <!-- 已选择座位时显示座位信息 -->
        <div v-else class="bg-white rounded-2xl shadow-card p-6">
          <div class="flex items-end justify-between">
            <div>
              <div class="text-sm font-medium text-gray mb-2 tracking-tight">您的座位</div>
              <div class="text-5xl font-bold text-gray-dark tracking-tight">
                {{ selectedSeat }}
              </div>
            </div>
            <button
              @click="reselectSeat"
              class="px-6 py-3 border-2 border-gray-light rounded-xl text-sm font-medium text-gray-dark hover:border-gray-dark transition-colors"
            >
              Change Seat
            </button>
          </div>

          <!-- 座位地图缩略图 -->
          <div class="mt-6 scale-75 origin-top-left pointer-events-none">
            <SeatMap :seats="seats" :selected-seat="selectedSeat" @select-seat="() => {}" />
          </div>
        </div>
      </section>

      <!-- ========== 分隔线 ========== -->
      <div class="border-t border-gray-light my-8"></div>

      <!-- ========== 日期和时间选择 ========== -->
      <section class="mb-8">
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">日期 & 时间</h2>

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
                class="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all tracking-tight"
                :class="[
                  time.selected
                    ? 'bg-success text-white shadow-md'
                    : 'border-2 border-gray-light text-gray-dark hover:border-gray-dark',
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
        <h2 class="text-sm font-medium text-gray-dark mb-4 tracking-tight">邀请伙伴</h2>

        <div class="flex flex-wrap gap-3">
          <!-- 已邀请的伙伴标签 -->
          <button
            v-for="partner in invitedPartners"
            :key="partner"
            @click="removePartner(partner)"
            class="inline-flex items-center gap-2 px-3 py-2 bg-primary-light rounded-full border border-primary hover:bg-primary/10 transition-colors group"
          >
            <span class="text-sm font-medium text-primary-dark">{{ partner }}</span>
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
    <div
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-light px-6 py-4 z-20 shadow-lg"
    >
      <div class="flex items-center justify-between max-w-2xl mx-auto gap-4">
        <!-- Coins 显示 -->
        <div class="flex items-center gap-2 px-4 py-2 bg-cyan/10 rounded-xl">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#51D5FF" />
            <path d="M12 7v10M7 12h10" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span class="text-lg font-bold text-cyan">{{ coinCost }}</span>
        </div>

        <!-- 预定按钮 -->
        <button
          @click="bookNow"
          :disabled="!selectedSeat"
          class="flex-1 px-8 py-4 bg-gray-dark text-white text-lg font-semibold rounded-xl hover:bg-gray-dark/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          立即预订
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
      v-model:visible="showFindPartnerModal"
      v-model:selected-partners="invitedPartners"
      @confirm="confirmPartnerInvite"
      @select-partner="handlePartnerSelect"
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
