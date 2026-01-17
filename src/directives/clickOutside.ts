import type { Directive } from 'vue'

/**
 * v-click-outside 指令
 * 点击元素外部时触发回调
 */
export const clickOutside: Directive = {
  mounted(el, binding) {
    el._clickOutside = (event: MouseEvent) => {
      // 检查点击事件是否发生在元素外部
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  },
}

// TypeScript 类型扩展
declare module '@vue/runtime-core' {
  interface CustomDirectives {
    clickOutside: (event: MouseEvent) => void
  }
}
