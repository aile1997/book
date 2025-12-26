import { ref } from 'vue'
import { searchUsers } from '../api'

export interface User {
  id: number
  username: string
  fullName: string
  email: string
}

export function useUsers() {
  const searchResults = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 根据关键词搜索用户
   * @param query 搜索关键词
   */
  async function search(query: string) {
    if (!query || query.length < 2) {
      searchResults.value = []
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await searchUsers(query)
      // 假设后端返回的 data 是一个 User 数组
      searchResults.value = response.data || response || []
    } catch (err: any) {
      error.value = '用户搜索失败: ' + (err.message || '未知错误')
      console.error(error.value, err)
      searchResults.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    searchResults,
    isLoading,
    error,
    search,
  }
}
