import { ref } from 'vue';
import { createBooking, getUserBookings, cancelBooking } from '../api';
import type { Booking } from '../types/booking';

// 预订管理组合式函数
export function useBooking() {
  const bookings = ref<Booking[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 创建新的预订
   * @param {object} bookingData - 预订数据 (e.g., { seatId: 'A1', startTime: '...', endTime: '...' })
   */
  async function makeBooking(bookingData: any) {
    isLoading.value = true;
    error.value = null;
    try {
      const newBooking = await createBooking(bookingData);
      // 假设 API 返回新的预订对象，将其添加到列表中
      bookings.value.push(newBooking);
      return newBooking;
    } catch (err: any) {
      error.value = '创建预订失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载当前用户的预订列表
   */
  async function loadBookings() {
    isLoading.value = true;
    error.value = null;
    try {
      // 假设 API 返回一个包含 bookings 数组的对象
      const data = await getUserBookings();
      if (data && data.bookings) {
        bookings.value = data.bookings;
      } else {
        bookings.value = [];
      }
    } catch (err: any) {
      error.value = '加载预订列表失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 取消一个预订
   * @param {string} bookingId - 要取消的预订 ID
   */
  async function removeBooking(bookingId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await cancelBooking(bookingId);
      // 从本地列表中移除已取消的预订
      bookings.value = bookings.value.filter(b => b.id !== bookingId);
    } catch (err: any) {
      error.value = '取消预订失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    bookings,
    isLoading,
    error,
    makeBooking,
    loadBookings,
    removeBooking,
  };
}
