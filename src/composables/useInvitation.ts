import { ref, onMounted, onUnmounted } from 'vue';
import { getUpcomingInvitations, acceptInvitation, declineInvitation } from '../api';

// 邀请接口的简化类型
export interface Invitation {
  id: number;
  senderName: string;
  bookingDate: string;
  timeSlot: string;
  seatNumber: string;
}

// 伙伴邀请管理组合式函数
export function useInvitation() {
  const upcomingInvitations = ref<Invitation[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let intervalId: number | null = null;

  /**
   * 加载未来邀请列表
   */
  async function loadInvitations() {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await getUpcomingInvitations();
      // 假设 API 返回一个包含 invitations 数组的对象
      if (data && data.invitations) {
        // 转换数据结构以简化前端使用
        upcomingInvitations.value = data.invitations.map((inv: any) => ({
          id: inv.invitationId,
          senderName: inv.sender.userName,
          bookingDate: inv.booking.bookingDate,
          timeSlot: inv.booking.timeSlot,
          seatNumber: inv.booking.seatNumber,
        }));
      } else {
        upcomingInvitations.value = [];
      }
    } catch (err: any) {
      error.value = '加载邀请列表失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 接受邀请
   * @param invitationId 邀请 ID
   */
  async function accept(invitationId: number) {
    try {
      await acceptInvitation(invitationId);
      // 成功后从列表中移除
      upcomingInvitations.value = upcomingInvitations.value.filter(inv => inv.id !== invitationId);
      return true;
    } catch (err: any) {
      error.value = '接受邀请失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
      return false;
    }
  }

  /**
   * 拒绝邀请
   * @param invitationId 邀请 ID
   */
  async function decline(invitationId: number) {
    try {
      await declineInvitation(invitationId);
      // 成功后从列表中移除
      upcomingInvitations.value = upcomingInvitations.value.filter(inv => inv.id !== invitationId);
      return true;
    } catch (err: any) {
      error.value = '拒绝邀请失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
      return false;
    }
  }

  // 启动轮询
  onMounted(() => {
    loadInvitations(); // 首次加载
    intervalId = setInterval(loadInvitations, 30000) as unknown as number; // 每 30 秒轮询一次
  });

  // 清除轮询
  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  });

  return {
    upcomingInvitations,
    isLoading,
    error,
    loadInvitations,
    accept,
    decline,
  };
}
