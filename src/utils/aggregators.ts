// src/utils/aggregators.ts

import type { TimeSlotDetail } from '../types/booking'

/**
 * 按日期分组时段数据
 * @param timeSlots - 时段数组
 * @param keyFormat - 键格式，'iso' 使用 ISO 日期，'display' 使用显示格式
 * @returns 按日期分组的映射
 */
export function groupTimeSlotsByDate<T extends { bookingDate: string }>(
  timeSlots: T[],
  keyFormat: 'iso' | 'display' = 'display'
): Record<string, T[]> {
  const map: Record<string, T[]> = {}

  timeSlots.forEach((slot) => {
    const key = keyFormat === 'iso' ? slot.bookingDate : formatDateKey(slot.bookingDate)
    if (!map[key]) {
      map[key] = []
    }
    map[key].push(slot)
  })

  return map
}

/**
 * 格式化日期键（内部辅助函数）
 */
function formatDateKey(dateString: string): string {
  const date = new Date(dateString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}

/**
 * 按 groupId 分组预订
 * @param bookings - 预订数组
 * @returns 按 groupId 分组的映射
 */
export function groupBookingsById<T extends { id?: number; groupId?: number }>(
  bookings: T[]
): Map<number, T[]> {
  const groups = new Map<number, T[]>()

  bookings.forEach((booking) => {
    const key = booking.groupId || booking.id
    if (key === undefined) return

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(booking)
  })

  return groups
}

/**
 * 获取组的最新日期（用于排序）
 * @param bookings - 预订数组
 * @returns 最新日期的 ISO 字符串
 */
export function getGroupLatestDate<T extends { timeSlotDetails?: TimeSlotDetail[]; bookingDate?: string }>(
  bookings: T[]
): string {
  for (const booking of bookings) {
    if (booking.timeSlotDetails && booking.timeSlotDetails.length > 0) {
      return booking.timeSlotDetails[0].bookingDate
    }
    if (booking.bookingDate) {
      return booking.bookingDate
    }
  }
  return ''
}
