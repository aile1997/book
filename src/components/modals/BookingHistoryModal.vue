<script setup lang="ts">
import { computed } from 'vue'
import { isBookingExpired } from '../../utils/time'

/**
 * 解析时段时间字符串
 * @param timeSlotName - 时间字符串，格式如 "09:00-12:00"
 * @returns 解析后的开始和结束时间，或 null（解析失败时）
 */
function parseTimeSlotName(timeSlotName: string): { startTime: string; endTime: string } | null {
  if (!timeSlotName) {
    console.warn('timeSlotName 为空')
    return null
  }

  const parts = timeSlotName.split('-')

  if (parts.length !== 2) {
    console.warn(`无效的 timeSlotName 格式: ${timeSlotName}`)
    return null
  }

  const [start, end] = parts

  if (!start || !end) {
    console.warn(`timeSlotName 包含空值: ${timeSlotName}`)
    return null
  }

  return {
    startTime: start.trim(),
    endTime: end.trim(),
  }
}

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
    id: number
    bookingDate: string
    timeSlotId: number
    timeSlotName?: string
    startTime: string
    endTime: string
    creditsRequired?: number
    slotStatus?: string
    bookingId: number
    seatId: number
    areaId: number
    seatNumber: string // 新增：座位号在 timeSlotDetails 中
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
 *
 * 新数据结构说明：
 * - seatNumber 字段在 timeSlotDetails 数组的每一项中
 * - 所有 timeSlotDetails 的 seatNumber 应该相同（同一组预订）
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

  // 提取组的最新日期用于排序
  const getGroupLatestDate = (bookings: RawBooking[]): string => {
    for (const booking of bookings) {
      if (booking.timeSlotDetails && booking.timeSlotDetails.length > 0) {
        // 返回最新日期（已在 booking 内部排序）
        return booking.timeSlotDetails[0].bookingDate
      }
      if (booking.bookingDate) {
        return booking.bookingDate
      }
    }
    return ''
  }

  // 按组排序：新日期在前（降序）
  const sortedGroups = Array.from(groups.entries()).sort(([, bookingsA], [, bookingsB]) => {
    const dateA = getGroupLatestDate(bookingsA)
    const dateB = getGroupLatestDate(bookingsB)
    // 降序：新日期在前
    return dateB.localeCompare(dateA)
  })

  return sortedGroups.map(([groupId, bookings]) => {
    const firstBooking = bookings[0]

    // 将所有 bookings 和对应的 timeSlots 展平并配对
    const pairedData: { timeSlot: TimeSlotDetail; booking: RawBooking; seatNumber?: string }[] = []

    bookings.forEach((b) => {
      // 新格式：timeSlotDetails 数组（包含 seatNumber）
      if (b.timeSlotDetails && Array.isArray(b.timeSlotDetails)) {
        b.timeSlotDetails.forEach((detail) => {
          // 解析时间：优先使用 startTime/endTime，否则从 timeSlotName 解析
          let startTime = detail.startTime || ''
          let endTime = detail.endTime || ''

          // 使用类型安全的时间解析函数
          if ((!startTime || !endTime) && detail.timeSlotName) {
            const parsed = parseTimeSlotName(detail.timeSlotName)
            if (parsed) {
              startTime = parsed.startTime
              endTime = parsed.endTime
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
            seatNumber: detail.seatNumber, // 新数据结构：seatNumber 在 detail 中
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
          seatNumber: b.seatNumber || b.seat || '',
        })
      }
    })

    // 组内时段按日期降序排序（新日期在前）
    pairedData.sort((a, b) => {
      const dateCompare = b.timeSlot.bookingDate.localeCompare(a.timeSlot.bookingDate)
      if (dateCompare !== 0) return dateCompare
      return b.timeSlot.startTime.localeCompare(a.timeSlot.startTime)
    })

    // 从第一个有效的 timeSlot detail 中提取座位号和桌号
    // 新数据结构：seatNumber 在 timeSlotDetails 中，格式为 "A-01"
    const seatNumber =
      pairedData[0]?.seatNumber || firstBooking.seatNumber || firstBooking.seat || ''

    // 提取桌号：处理 "A-01" 格式，取第一个字符
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

/**
 * 取消预订
 *
 * 业务逻辑说明：
 * - 对于多时段预订（有 groupId），取消任一时段都会取消整组
 * - 后端使用第一个 booking 的 ID 作为组标识符
 * - 因此取 group.bookings[0].id 作为取消目标的 ID
 *
 * @param group - 要取消的预订组
 */
const cancelBooking = (group: BookingGroup) => {
  // 明确逻辑：取第一个预订的 ID
  const firstBooking = group.bookings[0]

  if (!firstBooking) {
    console.error('取消预订失败：组中没有有效预订', group)
    return
  }

  // 优先使用 id（主键），回退到 bookingId（兼容旧数据）
  const bookingId = firstBooking.id ?? firstBooking.bookingId

  if (!bookingId) {
    console.error('取消预订失败：预订 ID 无效', firstBooking)
    return
  }

  emit('cancel-booking', bookingId)
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
                :class="[isGroupExpired(group.timeSlots) ? 'opacity-60 grayscale-[0.5]' : '']"
              >
                <div class="flex items-start justify-between mb-6">
                  <div class="flex items-center gap-4">
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
