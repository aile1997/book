// src/utils/time.ts

/**
 * 辅助函数：格式化日期为 YYYY-MM-DD 格式
 */
export const formatDateISO = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 判断预订是否已开始或已过期
 * @param dateStr 预订日期 (YYYY-MM-DD)
 * @param startTimeStr 预订开始时间 (HH:mm)
 */
export const isBookingExpired = (dateStr: string, startTimeStr: string) => {
  if (!dateStr || !startTimeStr) return true

  // 1. 获取中国标准时间，确保 now 的计算是准确的
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
  const nowTime = now.getHours() * 60 + now.getMinutes()

  // 2. 解析开始时间
  const [startHour, startMinute] = startTimeStr.split(':').map(Number)
  const startTimeInMinutes = startHour * 60 + startMinute

  // 3. 完全复用逻辑判断表达式
  // formatDateISO(now) === dateStr 判断是否是今天
  // dateStr < formatDateISO(now) 判断是否是过去
  const isPastDay = dateStr < formatDateISO(now)
  const isExpiredToday = formatDateISO(now) === dateStr && nowTime >= startTimeInMinutes

  return isPastDay || isExpiredToday
}
