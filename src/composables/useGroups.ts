import { ref } from 'vue'
import type { BookingGroup, Booking } from '../types/booking'

/**
 * 颜色生成器 - 生成色差较大的颜色，并按预订顺序排列
 *
 * 设计原则：
 * 1. 使用黄金角度（137.5°）分布色相，确保颜色差异最大化
 * 2. 固定饱和度和亮度，只变化色相，确保视觉一致性
 * 3. 颜色按预订顺序在色环上渐变，先预订的为冷色，后预订的为暖色
 * 4. 使用 HSL 颜色空间，便于控制和转换
 *
 * @param count - 需要生成的颜色数量
 * @param startHue - 起始色相（默认 200°，蓝色系）
 * @returns 颜色数组（HSL 格式字符串）
 */
function generateDistinctColors(count: number, startHue: number = 200): string[] {
  if (count === 0) return []
  if (count === 1) return [`hsl(${startHue}, 75%, 52%)`]

  const colors: string[] = []

  // 使用黄金角度（Golden Angle ≈ 137.5°）确保颜色分布均匀
  // 这比简单的 360/n 分布更好，因为可以避免颜色聚集
  const goldenAngle = 137.508 // 黄金角度（度）

  for (let i = 0; i < count; i++) {
    // 计算色相：起始色相 + 黄金角度 × 索引
    // 这样可以确保颜色在色环上均匀分布，且有一定顺序规律
    const hue = Math.floor((startHue + i * goldenAngle) % 360)

    // 固定饱和度为 75%，确保颜色鲜艳但不刺眼
    const saturation = 75

    // 固定亮度为 52%，确保：
    // - 颜色不会太亮（避免看不清）
    // - 颜色不会太暗（避免显得压抑）
    // - 适合在白色背景上显示深色文字
    const lightness = 52

    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }

  return colors
}

/**
 * 组（Group）管理组合式函数
 * 用于处理包含邀请人的订单分组和颜色管理
 */
export function useGroups() {
  // 组列表状态
  const groups = ref<BookingGroup[]>([])

  /**
   * 根据预订列表生成组
   * 包含邀请人的订单为一组，使用不同颜色标识
   * @param bookings - 预订列表
   * @returns 生成的组列表
   */
  const generateGroupsFromBookings = (bookings: Booking[]): BookingGroup[] => {
    // 筛选包含邀请人的订单
    const bookingsWithPartners = bookings.filter(b => b.partners && b.partners.length > 0)

    if (bookingsWithPartners.length === 0) {
      groups.value = []
      return []
    }

    // 为每个包含邀请人的订单生成一个组
    const generatedGroups: BookingGroup[] = bookingsWithPartners.map((booking, index) => {
      const colors = generateDistinctColors(bookingsWithPartners.length)

      return {
        id: booking.id,
        name: `${booking.seatNumber}组`,
        color: colors[index],
        memberIds: [booking.userId, ...booking.partners.map(p => p.partnerUserId)],
        bookingIds: [booking.id],
        createdAt: booking.createdAt
      }
    })

    groups.value = generatedGroups
    return generatedGroups
  }

  /**
   * 根据组ID获取组信息
   * @param groupId - 组 ID
   * @returns 组信息或 undefined
   */
  const getGroupById = (groupId: number): BookingGroup | undefined => {
    return groups.value.find(g => g.id === groupId)
  }

  /**
   * 按组分类预订
   * @param bookings - 预订列表
   * @returns 分组后的预订数据
   */
  const groupBookings = (bookings: Booking[]) => {
    const grouped = new Map<number, Booking[]>()

    // 将预订按组分类
    bookings.forEach(booking => {
      const groupId = booking.groupId || booking.id
      if (!grouped.has(groupId)) {
        grouped.set(groupId, [])
      }
      grouped.get(groupId)!.push(booking)
    })

    // 转换为数组格式，包含组信息和预订列表
    return Array.from(grouped.entries()).map(([groupId, bookings]) => ({
      group: getGroupById(groupId),
      bookings
    }))
  }

  /**
   * 为新预订生成组
   * @param booking - 预订数据
   * @returns 生成的组信息
   */
  const createGroupForBooking = (booking: Booking): BookingGroup => {
    const colors = generateDistinctColors(1)

    const newGroup: BookingGroup = {
      id: booking.id,
      name: `${booking.seatNumber}组`,
      color: colors[0],
      memberIds: [booking.userId],
      bookingIds: [booking.id],
      createdAt: booking.createdAt
    }

    // 如果有邀请的伙伴，添加到组成员中
    if (booking.partners && booking.partners.length > 0) {
      newGroup.memberIds.push(...booking.partners.map(p => p.partnerUserId))
    }

    groups.value.push(newGroup)
    return newGroup
  }

  /**
   * 清空组列表
   */
  const clearGroups = () => {
    groups.value = []
  }

  return {
    // 状态
    groups,
    // 方法
    generateGroupsFromBookings,
    getGroupById,
    groupBookings,
    createGroupForBooking,
    clearGroups
  }
}

// 单例模式导出
let groupsInstance: ReturnType<typeof useGroups> | null = null

export function useGroupsSingleton() {
  if (!groupsInstance) {
    groupsInstance = useGroups()
  }
  return groupsInstance
}
