import { ref, onUnmounted } from 'vue'
import { getUpcomingInvitations, acceptInvitation, declineInvitation } from '../api'
import { useBooking } from './useBooking'

/**
 * 时段详情（与 booking.timeSlotDetails 格式一致）
 */
export interface TimeSlotDetail {
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
  seatNumber: string
}

/**
 * 邀请类型（与 booking 数据格式一致，支持多时段）
 */
export interface Invitation {
  id: number
  groupId?: number
  inviter: {
    userId: number
    fullName: string
  }
  seatNumber?: string
  seat?: string
  bookingDate?: string // 单时段格式（兼容旧数据）
  startTime?: string // 单时段格式
  endTime?: string // 单时段格式
  timeSlot?: {
    // 单时段格式（兼容旧数据）
    id?: number
    time?: string
    startTime?: string
    endTime?: string
  }
  timeSlotDetails?: TimeSlotDetail[] // 多时段格式（与 booking 一致）
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  invitationStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' // 别名
}

const { loadBookings } = useBooking()

// 轮询间隔（例如 10 秒）
const POLLING_INTERVAL = 10000

// 模块级状态，实现单例
const upcomingInvitations = ref<Invitation[]>([])
const isLoadingInvitations = ref(false)
let pollingTimer: number | null = null
let isPollingActive = false // 轮询是否激活

/**
 * 获取未来邀请列表
 * 支持新的多时段数据格式（timeSlotDetails）和旧的单时段格式
 */
async function fetchInvitations() {
  isLoadingInvitations.value = true
  try {
    const response = await getUpcomingInvitations()
    const rawData = response.data || response || []
    const invitations = rawData.invitations || rawData

    upcomingInvitations.value = invitations.map((inv: any) => {
      // 优先使用新的多时段格式
      if (inv.timeSlotDetails && Array.isArray(inv.timeSlotDetails) && inv.timeSlotDetails.length > 0) {
        return {
          id: inv.id,
          groupId: inv.groupId,
          inviter: {
            userId: inv.inviterUserId || inv.inviter?.userId,
            fullName: inv.inviterName || inv.inviter?.fullName,
          },
          seatNumber: inv.timeSlotDetails[0]?.seatNumber || inv.seatNumber,
          timeSlotDetails: inv.timeSlotDetails,
          status: inv.invitationStatus || inv.status || 'PENDING',
        }
      }

      // 回退到旧的单时段格式
      return {
        id: inv.id,
        inviter: {
          userId: inv.inviterUserId || inv.inviter?.userId,
          fullName: inv.inviterName || inv.inviter?.fullName,
        },
        seat: {
          seatNumber: inv.seatNumber,
          areaName: inv.areaName,
        },
        bookingDate: inv.bookingDate,
        timeSlot: {
          id: inv.timeSlotId || 0,
          time: inv.timeRange || inv.timeSlot?.time,
          startTime: inv.timeSlot?.startTime || inv.startTime,
          endTime: inv.timeSlot?.endTime || inv.endTime,
        },
        status: inv.invitationStatus || inv.status || 'PENDING',
      }
    })
  } catch (error) {
    console.error('获取邀请列表失败:', error)
  } finally {
    isLoadingInvitations.value = false
  }
}

/**
 * 开始轮询邀请列表
 */
function startPolling() {
  if (isPollingActive) return // 防止重复启动

  isPollingActive = true

  // 设置轮询
  if (pollingTimer === null) {
    pollingTimer = setInterval(() => {
      // 只有在页面可见时才轮询
      if (!document.hidden) {
        fetchInvitations()
      }
    }, POLLING_INTERVAL) as unknown as number
  }

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

/**
 * 停止轮询
 */
function stopPolling() {
  isPollingActive = false

  if (pollingTimer !== null) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }

  // 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}

/**
 * 处理页面可见性变化
 */
function handleVisibilityChange() {
  if (!document.hidden && isPollingActive) {
    // 页面变为可见时，立即刷新一次数据
    fetchInvitations()
  }
}

/**
 * 接受邀请
 * @param invitationId 邀请 ID
 */
async function accept(invitationId: number) {
  try {
    await acceptInvitation(invitationId)
    // 成功后刷新列表
    await fetchInvitations()
    await loadBookings()
  } catch (error) {
    console.error('接受邀请失败:', error)
    throw error
  }
}

/**
 * 拒绝邀请
 * @param invitationId 邀请 ID
 */
async function decline(invitationId: number) {
  try {
    await declineInvitation(invitationId)
    // 成功后刷新列表
    await fetchInvitations()
  } catch (error) {
    console.error('拒绝邀请失败:', error)
    throw error
  }
}

/**
 * 邀请管理组合式函数
 */
export function useInvitations() {
  // 确保在组件卸载时停止轮询
  onUnmounted(stopPolling)

  return {
    upcomingInvitations,
    isLoadingInvitations,
    startPolling,
    stopPolling,
    accept,
    decline,
    fetchInvitations, // 暴露手动刷新函数
  }
}
