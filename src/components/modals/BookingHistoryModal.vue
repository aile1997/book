<script setup lang="ts">
import { ref, computed } from 'vue'

interface TimeSlotDetail {
  bookingDate: string
  startTime: string
  endTime: string
  timeSlotId: number
}

interface BookingGroup {
  groupId: number
  seat: string
  timeSlots: TimeSlotDetail[]
  totalCredits: number
  bookings: any[]
}

interface Props {
  visible: boolean
  bookings: BookingGroup[]
  isLoading: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'cancel-booking', bookingId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 关闭模态框
const close = () => {
  emit('update:visible', false)
}

// 取消预订
const cancelBooking = (bookingId: number) => {
  emit('cancel-booking', bookingId)
}

// 格式化日期显示
const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        style="
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.62) 0%,
            rgba(102, 102, 102, 0.62) 100%
          );
          backdrop-filter: blur(12.5px);
        "
        @click.self="close"
      >
        <div
          class="w-full max-w-[420px] rounded-[32px] bg-white px-6 pb-10 pt-8 animate-slide-up max-h-[85vh] overflow-y-auto shadow-2xl"
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-bold text-gray-dark tracking-tight">
              My Bookings
            </h2>
            <button
              @click="close"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#292D32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-16">
            <div class="text-gray-400 text-base font-medium animate-pulse">Loading...</div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="bookings.length === 0" class="text-center py-16">
            <div class="text-gray-400 text-base font-medium">No booking records found</div>
          </div>

          <!-- 预订列表 -->
          <div v-else class="space-y-6">
            <div
              v-for="group in bookings"
              :key="group.groupId"
              class="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <!-- 预订头部 -->
              <div class="flex items-start justify-between mb-5">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span class="text-2xl font-black text-primary">{{ group.seat }}</span>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Seat</div>
                    <div class="text-xl font-bold text-gray-dark tracking-tighter">{{ group.seat }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{{ group.timeSlots.length }} Slots</div>
                  <div class="flex items-center gap-1 justify-end">
                    <img src="@/assets/images/home/Vector.png" alt="" class="w-4 h-4" />
                    <span class="text-lg font-black text-cyan">{{ group.totalCredits }}</span>
                  </div>
                </div>
              </div>

              <!-- 时间段列表 -->
              <div class="space-y-2 mb-6">
                <div
                  v-for="(slot, index) in group.timeSlots"
                  :key="index"
                  class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100/50"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span class="text-sm font-bold text-gray-dark">{{ formatDateDisplay(slot.bookingDate) }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-500">{{ slot.startTime }} - {{ slot.endTime }}</span>
                </div>
              </div>

              <!-- 取消按钮 -->
              <button
                @click="cancelBooking(group.bookings[0].id || group.bookings[0].bookingId)"
                class="w-full py-4 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Cancel Booking
              </button>
            </div>
          </div>

          <!-- 底部关闭按钮 -->
          <button
            @click="close"
            class="w-full mt-10 py-4 rounded-xl bg-gray-dark text-white text-base font-bold hover:bg-black active:scale-[0.98] transition-all shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .animate-slide-up,
.modal-leave-to .animate-slide-up {
  transform: translateY(100%);
}

.animate-slide-up {
  transition: transform 0.3s ease;
}
</style>
