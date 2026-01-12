<script setup lang="ts">
import { computed } from 'vue'
import { isBookingExpired } from '../../utils/time'

interface RawBooking {
  id: number
  bookingId?: number
  groupId?: number
  seatNumber?: string
  seat?: string
  creditsUsed?: number
  totalCreditsUsed?: number
  bookingDate?: string
  startTime?: string
  endTime?: string
  timeSlotId?: number
  timeSlot?: { startTime?: string; endTime?: string; time?: string }
  timeSlotDetails?: Array<{
    bookingDate: string
    startTime: string
    endTime: string
    timeSlotId: number
    timeSlotName?: string
  }>
  partners?: any[]
}

interface TimeSlotDetail {
  bookingDate: string
  startTime: string
  endTime: string
  timeSlotId: number
}

interface BookingGroup {
  groupId: number
  seat: string
  table: string // 桌号（A、B、C）
  timeSlots: TimeSlotDetail[]
  totalCredits: number
  bookings: RawBooking[]
}

interface Props {
  visible: boolean
  bookings: RawBooking[] // 接收原始预订数据
  isLoading: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'cancel-booking', bookingId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const close = () => {
  emit('update:visible', false)
}

/**
 * 聚合预订信息（同一座位的多个时段聚合为一条记录）
 * bookings[i] 与 timeSlots[i] 保持一一对应关系
 */
const aggregatedBookings = computed<BookingGroup[]>(() => {
  const groups = new Map<number, RawBooking[]>()

  // 按 groupId 分组
  props.bookings.forEach((booking) => {
    const key = booking.groupId || booking.id
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(booking)
  })

  return Array.from(groups.entries()).map(([groupId, bookings]) => {
    const firstBooking = bookings[0]

    // 将所有 bookings 和对应的 timeSlots 展平并配对
    const pairedData: { timeSlot: TimeSlotDetail; booking: RawBooking }[] = []

    bookings.forEach((b) => {
      // 新格式：timeSlotDetails 数组
      if (b.timeSlotDetails && Array.isArray(b.timeSlotDetails)) {
        b.timeSlotDetails.forEach((detail) => {
          // 解析时间：优先使用 startTime/endTime，否则从 timeSlotName 解析
          let startTime = detail.startTime || ''
          let endTime = detail.endTime || ''

          if ((!startTime || !endTime) && detail.timeSlotName) {
            const timeParts = detail.timeSlotName.split('-')
            if (timeParts.length === 2) {
              startTime = timeParts[0].trim()
              endTime = timeParts[1].trim()
            }
          }

          pairedData.push({
            timeSlot: {
              bookingDate: detail.bookingDate,
              startTime,
              endTime,
              timeSlotId: detail.timeSlotId,
            },
            booking: b,
          })
        })
      }
      // 兼容旧格式：单个时段
      else if (b.bookingDate && (b.timeSlot || b.startTime)) {
        const startTime = b.timeSlot?.startTime || b.startTime || ''
        const endTime = b.timeSlot?.endTime || b.endTime || ''

        pairedData.push({
          timeSlot: {
            bookingDate: b.bookingDate,
            startTime,
            endTime,
            timeSlotId: b.timeSlotId || 0,
          },
          booking: b,
        })
      }
    })

    // 按日期和时间排序
    pairedData.sort((a, b) => {
      const dateCompare = a.timeSlot.bookingDate.localeCompare(b.timeSlot.bookingDate)
      if (dateCompare !== 0) return dateCompare
      return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime)
    })

    // 提取座位号和桌号
    const seatNumber = firstBooking.seatNumber || firstBooking.seat || ''
    const tableChar = seatNumber.charAt(0) || ''

    return {
      groupId,
      bookings: pairedData.map((p) => p.booking),
      seat: seatNumber,
      table: tableChar,
      timeSlots: pairedData.map((p) => p.timeSlot),
      totalCredits: bookings.reduce(
        (sum, b) => sum + (b.creditsUsed || b.totalCreditsUsed || 0),
        0,
      ),
    }
  })
})

// 核心逻辑：严格按照你提供的逻辑，取消整组（取第一个 booking 的 ID）
const cancelBooking = (group: BookingGroup) => {
  const target = group.bookings[0]
  const id = target?.id || target?.bookingId
  if (id) {
    emit('cancel-booking', id)
  }
}

const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}

// 判断整组是否过期
const isGroupExpired = (timeSlots: TimeSlotDetail[]) => {
  return timeSlots.every((slot) => isBookingExpired(slot.bookingDate, slot.startTime))
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end justify-center"
        style="background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px)"
        @click.self="close"
      >
        <div
          class="w-full max-w-[440px] rounded-t-[44px] bg-[#39D37F] px-8 pb-14 pt-10 animate-slide-up max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          <div class="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 shrink-0"></div>

          <div class="text-center mb-8 shrink-0">
            <h2 class="text-white text-[28px] font-black tracking-tighter italic uppercase">
              My Bookings
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar px-1">
            <div
              v-if="isLoading"
              class="text-center py-10 text-white/60 font-black tracking-widest italic animate-pulse"
            >
              LOADING...
            </div>

            <div
              v-else-if="aggregatedBookings.length === 0"
              class="text-center py-10 text-white/60 font-bold italic"
            >
              No active reservations.
            </div>

            <div v-else class="space-y-8">
              <div
                v-for="group in aggregatedBookings"
                :key="group.groupId"
                class="bg-white/10 rounded-[32px] p-6 border border-white/10 transition-all"
                :class="[isGroupExpired(group.timeSlots) ? 'opacity-40 grayscale-[0.5]' : '']"
              >
                <div class="flex items-start justify-between mb-6">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg"
                    >
                      <span class="text-3xl font-black text-[#39D37F] italic tracking-tighter">{{
                        group.seat || '--'
                      }}</span>
                    </div>
                    <div class="flex flex-col">
                      <span
                        class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1"
                        >Your Seat</span
                      >
                      <span class="text-xl font-bold text-white tracking-tight">
                        Table {{ group.table || '--' }}
                      </span>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="flex items-center gap-1.5 justify-end mb-1">
                      <img
                        src="@/assets/images/home/Vector.png"
                        alt=""
                        class="w-4 h-4 brightness-0 invert"
                      />
                      <span class="text-2xl font-black text-white tracking-tighter">{{
                        group.totalCredits
                      }}</span>
                    </div>
                    <span class="text-[9px] font-black text-white/50 uppercase tracking-widest"
                      >Credits</span
                    >
                  </div>
                </div>

                <div class="space-y-2 mb-6">
                  <div
                    v-for="(slot, index) in group.timeSlots"
                    :key="index"
                    class="flex items-center justify-between py-3 px-4 bg-white/5 rounded-2xl border border-white/5"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                      <span class="text-sm font-black text-white italic tracking-tight">
                        {{ formatDateDisplay(slot.bookingDate) }}
                      </span>
                    </div>
                    <span class="text-sm font-bold text-white/80">
                      {{ slot.startTime }} - {{ slot.endTime }}
                    </span>
                  </div>
                </div>

                <button
                  v-if="!isGroupExpired(group.timeSlots)"
                  @click="cancelBooking(group)"
                  class="w-full h-14 rounded-[20px] bg-white text-[#39D37F] text-sm font-black uppercase tracking-[0.2em] hover:bg-white/90 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path d="M18 6L6 18M6 6L18 18" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  Cancel Booking
                </button>
                <div
                  v-else
                  class="text-center py-2 text-white/40 text-[10px] font-black uppercase tracking-widest"
                >
                  This reservation has expired
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10 shrink-0">
            <button
              @click="close"
              class="w-full h-[68px] rounded-[24px] border-2 border-white/80 bg-transparent text-white text-xl font-black hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-[0.2em]"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
