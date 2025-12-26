import { ref, onUnmounted } from 'vue'
import { getUpcomingInvitations, acceptInvitation, declineInvitation } from '../api'

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

// 轮询间隔（例如 30 秒）
const POLLING_INTERVAL = 30000

// 模块级状态，实现单例
const upcomingInvitations = ref<Invitation[]>([])
const isLoadingInvitations = ref(false)
let pollingTimer: number | null = null

/**
 * 获取未来邀请列表
 */
async function fetchInvitations() {
  isLoadingInvitations.value = true
  try {
    const response = await getUpcomingInvitations()
    // 假设后端返回的数据结构与 Invitation 接口兼容
    // 注意：这里需要根据实际 API 返回结构进行适配，但为了重构，我们假设 API 返回的是 Invitation[]
    // 兼容 useInvitation.ts 中的数据转换逻辑，但使用 useInvitations.ts 的类型
    const rawData = response.data || response || []
    
    // 检查 rawData 是否包含 invitations 字段 (兼容 useInvitation.ts 的逻辑)
    const invitations = rawData.invitations || rawData

    upcomingInvitations.value = invitations.map((inv: any) => ({
      id: inv.invitationId || inv.id,
      inviter: {
        userId: inv.sender?.userId || inv.sender?.id || 0,
        fullName: inv.sender?.fullName || inv.sender?.userName || inv.senderName || '未知发送者',
      },
      seat: {
        seatNumber: inv.booking?.seatNumber || inv.seatNumber || '未知座位',
        areaName: inv.booking?.areaName || inv.areaName || '未知区域',
      },
      bookingDate: inv.booking?.bookingDate || inv.bookingDate || '未知日期',
      timeSlot: {
        id: inv.booking?.timeSlotId || inv.timeSlotId || 0,
        time: inv.booking?.timeSlot || inv.timeSlot || '未知时间段',
      },
      status: inv.status || 'PENDING',
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
  // 立即执行一次
  fetchInvitations()

  // 设置轮询
  if (pollingTimer === null) {
    pollingTimer = setInterval(fetchInvitations, POLLING_INTERVAL) as unknown as number
  }
}

/**
 * 停止轮询
 */
function stopPolling() {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer)
    pollingTimer = null
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
