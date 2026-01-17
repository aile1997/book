<script setup lang="ts">
import { computed } from 'vue'
import { isBookingExpired } from '../../utils/time'
import { formatDateFull } from '../../utils/formatters'
import { parseTimeSlotName } from '../../utils/bookingHelpers'

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

const groupByDate = (timeSlots: TimeSlotDetail[]) => {
  const map: Record<string, TimeSlotDetail[]> = {}
  timeSlots.forEach((slot) => {
    const displayDate = formatDateFull(slot.bookingDate) // 例如 "01.10 MON"
    if (!map[displayDate]) map[displayDate] = []
    map[displayDate].push(slot)
  })
  return map
}

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
          class="w-full rounded-t-[40px] bg-[#39D37F] px-6 pb-10 pt-8 animate-slide-up max-h-[75vh] flex flex-col shadow-2xl overflow-hidden"
        >
          <div class="text-center mb-6 shrink-0">
            <h2 class="text-white text-xl font-medium tracking-tight">My Bookings</h2>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div v-if="isLoading" class="text-center py-6 text-white/60 text-sm animate-pulse">
              LOADING...
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="group in aggregatedBookings"
                :key="group.groupId"
                class="bg-white/10 rounded-[8px] p-3 border border-white/5 transition-all"
                :class="[isGroupExpired(group.timeSlots) ? 'opacity-50 grayscale' : '']"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-2xl font-medium text-white tracking-tighter">
                    {{ group.seat || '--' }}
                  </span>

                  <button
                    v-if="!isGroupExpired(group.timeSlots)"
                    @click="cancelBooking(group)"
                    class="flex items-center gap-1 px-3 py-1 rounded-[4px] bg-white/10 border border-white/20 text-white text-[14px] font-medium hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Cancel
                  </button>
                </div>

                <div class="w-full h-[0.5px] bg-white/10 mb-2"></div>

                <div
                  class="flex justify-between text-[12px] font-medium tracking-widest text-white/75 mb-3"
                >
                  <span>Date</span>
                  <span>Slot</span>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="(slotsByDate, dateLabel) in groupByDate(group.timeSlots)"
                    :key="dateLabel"
                    class="flex justify-between items-start"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-base font-medium text-white tracking-tight">
                        {{ dateLabel.split(' ')[0] }}
                      </span>
                      <span
                        class="px-1.2 py-0.2 rounded bg-white/10 text-[8px] text-white font-medium"
                      >
                        {{ dateLabel.split(' ')[1] }}
                      </span>
                    </div>

                    <div class="flex flex-col items-end gap-0">
                      <span
                        v-for="(slot, idx) in slotsByDate"
                        :key="idx"
                        class="text-sm font-medium text-white tracking-tighter"
                      >
                        {{ slot.startTime }}-{{ slot.endTime }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-center shrink-0">
            <button
              @click="close"
              class="w-[200px] px-8 py-3 bg-transparent border-2 border-white text-white text-lg font-medium rounded-xl hover:bg-white/10 transition-all"
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
