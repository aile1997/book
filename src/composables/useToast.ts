import { ref } from 'vue'

export interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  duration: number
  visible: boolean
  // 新增：用于 Confirm 的回调
  onConfirm?: () => void
  onCancel?: () => void
}

// 全局Toast状态
const toasts = ref<ToastMessage[]>([])
let toastIdCounter = 0

export function useToast() {
  /**
   * 显示Toast消息
   * @param message 消息内容
   * @param type 消息类型
   * @param duration 显示时长（毫秒），0表示不自动关闭
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 3000,
  ) => {
    const id = toastIdCounter++
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration,
      visible: true,
    }

    toasts.value.push(toast)

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration + 500) // 额外500ms用于动画
    }
  }

  /**
   * 显示成功消息
   */
  const success = (message: string, duration?: number) => {
    showToast(message, 'success', duration)
  }

  /**
   * 显示错误消息
   */
  const error = (message: string, duration?: number) => {
    showToast(message, 'error', duration)
  }

  /**
   * 显示警告消息
   */
  const warning = (message: string, duration?: number) => {
    showToast(message, 'warning', duration)
  }

  /**
   * 显示信息消息
   */
  const info = (message: string, duration?: number) => {
    showToast(message, 'info', duration)
  }

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = toastIdCounter++
      const toast: ToastMessage = {
        id,
        message,
        type: 'confirm',
        duration: 0, // Confirm 不自动关闭
        visible: true,
        onConfirm: () => {
          removeToast(id)
          resolve(true)
        },
        onCancel: () => {
          removeToast(id)
          resolve(false)
        },
      }
      toasts.value.push(toast)
    })
  }

  /**
   * 移除指定Toast
   */
  const removeToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value[index].visible = false
      // 等待动画完成后移除
      setTimeout(() => {
        toasts.value.splice(index, 1)
      }, 300)
    }
  }

  /**
   * 清空所有Toast
   */
  const clearAll = () => {
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearAll,
    confirm,
  }
}
