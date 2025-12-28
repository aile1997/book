import { ref } from 'vue'
import {
  createBooking,
  getUserBookings,
  cancelBooking,
  getUserCredits,
  getUserTransactions,
} from '../api'
import type { Booking } from '../types/booking'

// 预订管理组合式函数
export function useBooking() {
  const bookings = ref<Booking[]>([])
  const transactions = ref<any[]>([]) // 新增：交易记录
  const coins = ref(0) // 新增：积分余额
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 创建新的预订
   * @param {object} bookingData - 预订数据 (e.g., { seatId: 1, bookingDate: '2025-12-23', timeSlotId: 0, partnerSeatMap: {} })
   */
  async function makeBooking(bookingData: any) {
    isLoading.value = true
    error.value = null
    try {
      const newBooking = await createBooking(bookingData)
      // 假设 API 返回新的预订对象，将其添加到列表中
      bookings.value.push(newBooking)
      return newBooking
    } catch (err: any) {
      error.value = '创建预订失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载当前用户的预订列表
   */
  async function loadBookings() {
    isLoading.value = true
    error.value = null
    try {
      // 假设 API 返回一个包含 bookings 数组的对象
      const data = await getUserBookings()
      const rawBookings = data.bookings || data || []
      bookings.value = rawBookings
    } catch (err: any) {
      error.value = '加载预订列表失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取消一个预订
   * @param {string} bookingId - 要取消的预订 ID
   */
  async function removeBooking(bookingId: number) {
    isLoading.value = true
    error.value = null
    try {
      await cancelBooking(bookingId)
      // 从本地列表中移除已取消的预订，注意 ID 类型匹配
      bookings.value = bookings.value.filter((b) => b.id !== bookingId)
    } catch (err: any) {
      error.value = '取消预订失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载当前用户的积分余额
   */
  async function loadUserCredits() {
    try {
      const data = await getUserCredits()
      coins.value = data.credits || 0
    } catch (err) {
      console.error('加载积分余额失败:', err)
    }
  }

  /**
   * 加载当前用户的交易记录
   */
  async function loadUserTransactions() {
    try {
      const data = await getUserTransactions()
      // 假设 API 返回一个包含 transactions 数组的对象
      transactions.value = data.transactions || data || []
    } catch (err) {
      console.error('加载交易记录失败:', err)
    }
  }

  return {
    bookings,
    transactions,
    coins,
    isLoading,
    error,
    makeBooking,
    loadBookings,
    removeBooking,
    loadUserCredits,
    loadUserTransactions,
  }
}
