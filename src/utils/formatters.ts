// src/utils/formatters.ts

/**
 * 星期枚举
 */
export const Weekdays = {
  SHORT: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const,
  SHORT_WITH_DOT: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'] as const,
  FULL: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const,
} as const

/**
 * 日期格式枚举
 */
export const DateFormats = {
  DISPLAY: 'MM.DD', // 01.15
  ISO: 'YYYY-MM-DD', // 2026-01-15
  FULL: 'MM.DD WWW', // 01.15 MON
  FULL_WITH_DOT: 'MM.DD Www.', // 01.15 Mon.
} as const

/**
 * 格式化日期为 MM.DD 格式
 * @param date - 日期对象
 * @returns 格式化后的字符串，例如 "01.15"
 */
export function formatDateShort(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

/**
 * 格式化日期为 MM.DD WWW 格式（带星期）
 * @param dateString - ISO 日期字符串，例如 "2026-01-15"
 * @param weekdayStyle - 星期样式，默认为 SHORT
 * @returns 格式化后的字符串，例如 "01.15 MON"
 */
export function formatDateFull(
  dateString: string,
  weekdayStyle: 'SHORT' | 'SHORT_WITH_DOT' | 'FULL' = 'SHORT'
): string {
  const date = new Date(dateString)
  const shortDate = formatDateShort(date)

  const weekdays =
    weekdayStyle === 'SHORT_WITH_DOT'
      ? Weekdays.SHORT_WITH_DOT
      : weekdayStyle === 'FULL'
        ? Weekdays.FULL
        : Weekdays.SHORT

  const weekday = weekdays[date.getDay()]
  return `${shortDate} ${weekday}`
}

/**
 * 获取星期几
 * @param dateString - ISO 日期字符串
 * @param style - 星期样式，默认为 SHORT
 * @returns 星期字符串，例如 "MON"
 */
export function getWeekday(
  dateString: string,
  style: 'SHORT' | 'SHORT_WITH_DOT' | 'FULL' = 'SHORT'
): string {
  const date = new Date(dateString)
  const weekdays =
    style === 'SHORT_WITH_DOT'
      ? Weekdays.SHORT_WITH_DOT
      : style === 'FULL'
        ? Weekdays.FULL
        : Weekdays.SHORT

  return weekdays[date.getDay()]
}

/**
 * 获取星期几（从 Date 对象）
 * @param date - 日期对象
 * @param style - 星期样式，默认为 SHORT_WITH_DOT
 * @returns 星期字符串，例如 "Mon."
 */
export function getWeekdayFromDate(
  date: Date,
  style: 'SHORT' | 'SHORT_WITH_DOT' | 'FULL' = 'SHORT_WITH_DOT'
): string {
  const weekdays =
    style === 'SHORT_WITH_DOT'
      ? Weekdays.SHORT_WITH_DOT
      : style === 'FULL'
        ? Weekdays.FULL
        : Weekdays.SHORT

  return weekdays[date.getDay()]
}

/**
 * 格式化时间范围
 * @param startTime - 开始时间，例如 "09:00"
 * @param endTime - 结束时间，例如 "12:00"
 * @returns 时间范围字符串，例如 "09:00 - 12:00"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`
}
