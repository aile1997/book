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
          class="w-full max-w-[420px] rounded-t-[45px] bg-white px-6 pb-12 pt-10 animate-slide-up max-h-[80vh] overflow-y-auto"
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-medium text-gray-dark leading-[100%]">
              我的预订
            </h2>
            <button
              @click="close"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#292D32"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="text-gray text-base">加载中...</div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="bookings.length === 0" class="text-center py-12">
            <div class="text-gray text-base">暂无预订记录</div>
          </div>

          <!-- 预订列表 -->
          <div v-else class="space-y-4">
            <div
              v-for="group in bookings"
              :key="group.groupId"
              class="bg-gray-50 rounded-2xl p-5 border border-gray-100"
            >
              <!-- 预订头部 -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <span class="text-xl font-bold text-success">{{ group.seat }}</span>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">座位号</div>
                    <div class="text-lg font-semibold text-gray-dark">{{ group.seat }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-gray-500 mb-1">共 {{ group.timeSlots.length }} 个时段</div>
                  <div class="text-sm font-medium text-success">{{ group.totalCredits }} 积分</div>
                </div>
              </div>

              <!-- 时间段列表 -->
              <div class="space-y-2 mb-4">
                <div
                  v-for="(slot, index) in group.timeSlots"
                  :key="index"
                  class="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-success"></div>
                    <span class="text-sm text-gray-dark">{{ formatDateDisplay(slot.bookingDate) }}</span>
                  </div>
                  <span class="text-sm text-gray">{{ slot.startTime }} - {{ slot.endTime }}</span>
                </div>
              </div>

              <!-- 取消按钮 -->
              <button
                @click="cancelBooking(group.bookings[0].id || group.bookings[0].bookingId)"
                class="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors"
              >
                取消预订
              </button>
            </div>
          </div>

          <!-- 底部关闭按钮 -->
          <button
            @click="close"
            class="w-full mt-8 py-4 rounded-xl bg-gray-dark text-white text-lg font-medium hover:bg-gray-700 transition-colors"
          >
            关闭
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
