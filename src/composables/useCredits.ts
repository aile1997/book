import { ref } from 'vue';
import { getUserCredits, getUserTransactions } from '../api';
import type { Transaction } from '../types/booking'; // 假设 Transaction 类型已定义

// 积分管理组合式函数
export function useCredits() {
  const credits = ref<number | null>(null);
  const transactions = ref<Transaction[]>([]);
  const isLoadingCredits = ref(false);
  const isLoadingTransactions = ref(false);
  const error = ref<string | null>(null);

  /**
   * 加载当前用户的积分余额
   */
  async function loadCredits() {
    isLoadingCredits.value = true;
    error.value = null;
    try {
      const data = await getUserCredits();
      // 假设 API 返回 { credits: number }
      if (data && typeof data.credits === 'number') {
        credits.value = data.credits;
      } else {
        credits.value = 0;
      }
    } catch (err: any) {
      error.value = '加载积分余额失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
      credits.value = null;
    } finally {
      isLoadingCredits.value = false;
    }
  }

  /**
   * 加载当前用户的积分交易记录
   */
  async function loadTransactions() {
    isLoadingTransactions.value = true;
    error.value = null;
    try {
      // 假设 API 返回一个包含 transactions 数组的对象
      const data = await getUserTransactions();
      if (data && data.transactions) {
        transactions.value = data.transactions;
      } else {
        transactions.value = [];
      }
    } catch (err: any) {
      error.value = '加载交易记录失败: ' + (err.message || '未知错误');
      console.error(error.value, err);
      transactions.value = [];
    } finally {
      isLoadingTransactions.value = false;
    }
  }

  return {
    credits,
    transactions,
    isLoadingCredits,
    isLoadingTransactions,
    error,
    loadCredits,
    loadTransactions,
  };
}
