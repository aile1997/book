// src/utils/bookingHelpers.ts

/**
 * 时段数据接口
 */
export interface TimeSlotData {
  bookingDate: string
  startTime: string
  endTime: string
}

/**
 * 选中的时段数据接口（来自 selectedTimeSlots）
 */
export interface SelectedTimeSlotData {
  key: string
  dateISO: string
  date: string
  time: string // 格式: "09:00 - 12:00"
  timeSlotId: string | number
  weekday?: string
  isExpired?: boolean
}

/**
 * 转换时间段数据格式
 * 兼容两种格式：
 * 1. selectedTimeSlots 格式：{ key, dateISO, date, time, timeSlotId, ... }
 * 2. timeSlotDetails 格式：{ bookingDate, startTime, endTime, ... }
 *
 * @param slots - 时段数组
 * @returns 标准化的时段数据
 */
export function transformTimeSlots(
  slots: Array<TimeSlotData | SelectedTimeSlotData>
): TimeSlotData[] {
  if (!slots || !Array.isArray(slots)) return []

  return slots.map((slot) => {
    // 如果已经是标准格式（有 bookingDate、startTime、endTime）
    if ('bookingDate' in slot && slot.startTime && slot.endTime) {
      return slot as TimeSlotData
    }

    // 转换 selectedTimeSlots 格式
    // time 格式为 "09:00 - 12:00"，需要解析
    const selectedSlot = slot as SelectedTimeSlotData
    const timeRange = selectedSlot.time || ''
    const [startTime, endTime] = timeRange.split(' - ').map((t: string) => t.trim())

    return {
      bookingDate: selectedSlot.dateISO || selectedSlot.date,
      startTime,
      endTime,
    }
  })
}

/**
 * 解析时间段名称
 * @param timeSlotName - 时间段名称，例如 "上午时段" 或 "09:00-12:00"
 * @returns 解析后的 { startTime, endTime } 或 null
 */
export function parseTimeSlotName(timeSlotName: string): { startTime: string; endTime: string } | null {
  // 匹配 "HH:mm-HH:mm" 或 "HH:mm - HH:mm" 格式
  const timeMatch = timeSlotName.match(/(\d{1,2}):(\d{2})[-\s](\d{1,2}):(\d{2})/)
  if (timeMatch) {
    const [, startHour, startMin, endHour, endMin] = timeMatch
    return {
      startTime: `${startHour.padStart(2, '0')}:${startMin}`,
      endTime: `${endHour.padStart(2, '0')}:${endMin}`,
    }
  }

  // 匹配中文时段名称
  if (timeSlotName.includes('上午')) {
    return { startTime: '09:00', endTime: '12:00' }
  }
  if (timeSlotName.includes('下午')) {
    return { startTime: '14:00', endTime: '17:00' }
  }

  return null
}

/**
 * 按日期分组时段数据（兼容性包装函数）
 * @param slots - 时段数组
 * @returns 按日期分组的映射，key 为 "01.15 MON" 格式
 */
export function groupSlotsByDate(slots: TimeSlotData[]): Record<string, TimeSlotData[]> {
  const map: Record<string, TimeSlotData[]> = {}

  slots.forEach((slot) => {
    const date = slot.bookingDate
    if (!map[date]) {
      map[date] = []
    }
    map[date].push(slot)
  })

  return map
}
