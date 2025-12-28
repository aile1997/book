import { ref, onUnmounted } from 'vue'
import { getUpcomingInvitations, acceptInvitation, declineInvitation } from '../api'
import { useBooking } from './useBooking'

// 定义邀请的类型 (使用 useInvitations.ts 的更详细类型)
export interface Invitation {
  id: number
  inviter: {
    userId: number
    fullName: string
  }
  seat: {
    seatNumber: string
    areaName: string
  }
  bookingDate: string
  timeSlot: {
    id: number
    time: string
  }
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
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
 */
async function fetchInvitations() {
  isLoadingInvitations.value = true
  try {
    const response = await getUpcomingInvitations()
    // 假设后端返回的数据结构与 Invitation 接口兼容
    // 注意：这里需要根据实际 API 返回结构进行适配，但为了重构，我们假设 API 返回的是 Invitation[]
    // 适配新的 API 返回结构
    // 后端返回: { id, inviterName, seatNumber, areaName, bookingDate, timeRange, invitationStatus }
    const rawData = response.data || response || []
    const invitations = rawData.invitations || rawData // 假设 response.data.invitations 或 response 是数组

    upcomingInvitations.value = invitations.map((inv: any) => ({
      id: inv.id,
      inviter: {
        userId: inv.inviterUserId, // 使用 inviterUserId
        fullName: inv.inviterName, // 使用 inviterName
      },
      seat: {
        seatNumber: inv.seatNumber, // 使用 seatNumber
        areaName: inv.areaName, // 使用 areaName
      },
      bookingDate: inv.bookingDate, // 使用 bookingDate
      timeSlot: {
        id: 0, // 新 API 结构中没有 timeSlotId，使用默认值
        time: inv.timeRange, // 使用 timeRange
      },
      status: inv.invitationStatus || 'PENDING', // 使用 invitationStatus
    }))
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
