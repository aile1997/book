<script setup lang="ts">
import { computed } from 'vue'

interface TimeSlotData {
  bookingDate: string
  startTime: string
  endTime: string
}

interface Props {
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  // 传入当前选中的座位和时间段数据（可选）
  data?: {
    seatNumber?: string
    timeSlots?: any[]
    totalCost?: number
  }
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
})

/**
 * 转换时间段数据格式
 * 兼容两种格式：
 * 1. selectedTimeSlots 格式：{ key, dateISO, date, time, timeSlotId, ... }
 * 2. timeSlotDetails 格式：{ bookingDate, startTime, endTime, ... }
 */
const transformTimeSlots = (slots: any[]): TimeSlotData[] => {
  if (!slots || !Array.isArray(slots)) return []

  return slots.map((slot) => {
    // 如果已经是标准格式（有 bookingDate、startTime、endTime）
    if (slot.bookingDate && slot.startTime && slot.endTime) {
      return slot
    }

    // 转换 selectedTimeSlots 格式
    // time 格式为 "09:00 - 12:00"，需要解析
    const timeRange = slot.time || slot.timeRange || ''
    const [startTime, endTime] = timeRange.split(' - ').map((t: string) => t.trim())

    return {
      bookingDate: slot.dateISO || slot.date,
      startTime,
      endTime,
    }
  })
}

// 辅助函数：按日期分组（保持与 AccountPage 一致）
const groupByDate = (slots: any[]) => {
  // 先转换数据格式
  const transformedSlots = transformTimeSlots(slots)

  const map: Record<string, TimeSlotData[]> = {}
  transformedSlots.forEach((slot) => {
    const d = slot.bookingDate
    if (!map[d]) map[d] = []
    map[d].push(slot)
  })
  return map
}

// 获取星期几的简写
const getDayOfWeek = (dateStr: string) => {
  if (!dateStr) return ''
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? '' : days[date.getDay()]
}

// 计算是否应该显示详细数据模式
const shouldShowDetails = computed(() => {
  return !!(props.data && props.data.seatNumber && props.data.timeSlots?.length > 0)
})

const emit = defineEmits<Emits>()

const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:visible', false)
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
        @click.self="handleCancel"
      >
        <!-- 详细数据模式：显示座位和时段信息 -->
        <div
          v-if="shouldShowDetails"
          class="w-full max-w-[340px] bg-[#2C2C2C] rounded-[32px] p-6 shadow-2xl flex flex-col text-white"
        >
          <h3 class="text-2xl font-semibold mb-6 text-center">{{ title }}</h3>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between items-center border-b border-white/20 pb-3">
              <span class="text-white/60 text-sm">Seat</span>
              <span class="text-2xl font-medium tracking-tight">{{ data?.seatNumber }}</span>
            </div>

            <div class="space-y-3">
              <div
                class="flex justify-between text-[10px] text-white/50 uppercase tracking-widest px-0.5"
              >
                <span>Date</span>
                <span>Slot</span>
              </div>

              <div
                v-for="(slots, date) in groupByDate(data?.timeSlots || [])"
                :key="date"
                class="flex justify-between items-start"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base font-medium">{{ date }}</span>
                  <span class="px-1.2 py-0.2 rounded bg-white/10 text-[8px] font-medium">
                    {{ getDayOfWeek(date) }}
                  </span>
                </div>
                <div class="flex flex-col items-end gap-0.5">
                  <span
                    v-for="(slot, idx) in slots"
                    :key="idx"
                    class="text-sm font-medium tracking-tighter"
                  >
                    {{ slot.startTime }}-{{ slot.endTime }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="data?.totalCost !== undefined"
              class="flex justify-between items-center pt-3 border-t border-white/20"
            >
              <span class="text-white/60 text-sm">Total Cost</span>
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <span class="text-[#2C2C2C] text-xs font-bold">€</span>
                </div>
                <span class="text-xl font-bold">{{ data.totalCost }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="handleCancel"
              class="flex-1 py-3.5 rounded-2xl border border-white/30 text-white text-base font-medium active:scale-95 transition-all"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="flex-1 py-3.5 rounded-2xl bg-white text-[#2C2C2C] text-base font-bold shadow-lg active:scale-95 transition-all"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>

        <!-- 简单消息模式：显示纯文本消息（原始样式） -->
        <div
          v-else
          class="w-full max-w-[320px] bg-[#2C2C2C] rounded-[24px] p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center"
        >
          <h3 class="text-white text-xl font-bold mb-3">{{ title }}</h3>
          <p class="text-white/70 text-sm mb-8 leading-relaxed whitespace-pre-line">
            {{ message }}
          </p>

          <div class="flex flex-col gap-3 w-full">
            <button
              @click="handleConfirm"
              class="w-full py-3.5 bg-white text-[#2C2C2C] text-base font-bold rounded-xl active:scale-95 transition-all"
            >
              {{ confirmText }}
            </button>

            <button
              @click="handleCancel"
              class="w-full py-3.5 bg-transparent border border-white/20 text-white/80 text-base font-medium rounded-xl hover:bg-white/5 active:scale-95 transition-all"
            >
              {{ cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
