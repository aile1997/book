<script setup lang="ts">
import { ref, computed } from 'vue'

interface Option {
  key: string
  label: string
  disabled?: boolean
}

interface Props {
  modelValue: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择...',
  disabled: false,
})

const emit = defineEmits<Emits>()

// 下拉框显示状态
const isOpen = ref(false)

// 当前选中的选项
const selectedOption = computed(() => {
  return props.options.find((opt) => opt.key === props.modelValue)
})

// 切换下拉框
const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

// 选择选项
const selectOption = (key: string) => {
  emit('update:modelValue', key)
  isOpen.value = false
}

// 点击外部关闭下拉框
const handleClickOutside = () => {
  isOpen.value = false
}
</script>

<template>
  <div class="relative" v-click-outside="handleClickOutside">
    <!-- 触发按钮 -->
    <button
      type="button"
      :disabled="disabled"
      @click="toggleDropdown"
      class="w-full px-4 py-2.5 rounded-lg text-base font-medium text-left transition-all duration-200 flex items-center justify-between"
      :class="[
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/50',
        isOpen ? 'ring-2 ring-white/50' : '',
      ]"
    >
      <span class="truncate">
        {{ selectedOption?.label || placeholder }}
      </span>
      <!-- 下拉箭头图标 -->
      <svg
        class="w-5 h-5 ml-2 transition-transform duration-200 flex-shrink-0"
        :class="isOpen ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- 下拉选项列表 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
      >
        <div
          v-for="option in options"
          :key="option.key"
          @click="!option.disabled && selectOption(option.key)"
          class="px-4 py-2.5 text-base cursor-pointer transition-colors"
          :class="[
            option.key === modelValue
              ? 'bg-success/10 text-success font-semibold'
              : option.disabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-dark hover:bg-gray-50',
          ]"
        >
          <div class="flex items-center justify-between">
            <span>{{ option.label }}</span>
            <!-- 选中标记 -->
            <svg
              v-if="option.key === modelValue"
              class="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #b9b9b9;
}
</style>
