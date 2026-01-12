<script setup lang="ts">
import { ref, computed, watch, onMounted, watchEffect } from 'vue'
import { useSeats } from '../../composables/useSeats'
import { debounce } from '../../utils/debounce'
import type { Partner, SelectedTimeSlot, BookingGroup } from '../../types/booking'
import { useSeatConfig } from '../../composables/useSeatConfig'
import { useGroupsSingleton } from '../../composables/useGroups'
import PinyinMatch from 'pinyin-match'

interface Props {
  visible: boolean
  selectedPartners: Partner[]
  selectedTimeSlots?: SelectedTimeSlot[]  // 新增：选中的时段列表
}

interface SeatWithGroup {
  seat: string
  partner: Partner | null
  isAvailable: boolean
  groupId?: number
  groupColor?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedPartners', value: Partner[]): void
  (e: 'confirm'): void
  (e: 'select-partner', partner: Partner): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 多时段选择状态 ==========

// 当前选择的时间段（用于过滤显示）
const selectedTimeSlotKey = ref<string | null>(null)

// 监听 selectedTimeSlots 变化，默认选中第一个（如果只有一个时段则不显示选择器）
watch(() => props.selectedTimeSlots, (newSlots) => {
  if (newSlots && newSlots.length > 0) {
    // 如果只有一个时段，默认选中它；如果有多个时段，默认选中第一个
    if (newSlots.length === 1) {
      selectedTimeSlotKey.value = newSlots[0].key
    } else if (!selectedTimeSlotKey.value) {
      selectedTimeSlotKey.value = null // 默认显示"全部时段"
    }
  }
}, { immediate: true })

// 获取当前选择的时间段信息
const currentTimeSlot = computed(() => {
  if (!props.selectedTimeSlots || props.selectedTimeSlots.length === 0) return null
  // 如果选择了"全部时段"（null），返回 null
  if (!selectedTimeSlotKey.value) return null
  return props.selectedTimeSlots.find((slot) => slot.key === selectedTimeSlotKey.value)
})

// ========== 组功能状态 ==========

const useGroups = useGroupsSingleton()

// 根据桌子获取座位布局，并关联伙伴数据和组信息
const tableSeatMap = computed(() => {
  // 1. 过滤出当前桌子的座位
  if (!seatAvailability.value || seatAvailability.value.length === 0) {
    console.warn('Seats array is empty, cannot map table seatAvailability')
    return []
  }

  // 过滤出当前桌子的座位
  let currentTableSeats = seatAvailability.value.filter((s) => s.table === selectedTable.value)

  // 如果没有座位数据，返回空数组
  if (currentTableSeats.length === 0) {
    return []
  }

  // 2. 生成组信息（从座位可用性数据中提取）
  const seatsWithGroups = currentTableSeats.map((seat) => {
    const result: SeatWithGroup = {
      seat: seat.seatNumber,
      partner: seat.bookingUserInfo
        ? {
            id: seat.bookingUserInfo.userId,
            username: seat.bookingUserInfo.username,
            fullName: seat.bookingUserInfo.fullName,
            email: '', // 暂时留空
          }
        : null,
      isAvailable: seat.isAvailable
    }

    // 添加组信息
    if (seat.groupId !== null && seat.groupId !== undefined) {
      result.groupId = seat.groupId
      // 为每个组生成一致的颜色
      const groupColor = generateGroupColor(seat.groupId)
      result.groupColor = groupColor
    }

    return result
  })

  return seatsWithGroups
})

// 生成组颜色（基于 groupId）
function generateGroupColor(groupId: number): string {
  // 使用 HSL 颜色空间生成色差较大的颜色
  const hue = (groupId * 137.5) % 360  // 黄金角度，确保颜色分布均匀
  const saturation = 70 + (groupId % 3) * 10  // 70-90%
  const lightness = 45 + (groupId % 2) * 15    // 45-60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// 加载全局座位配置
const { getSeatGroupConfig, generateSeatPath, colors } = useSeatConfig()

// 使用伙伴管理组合式函数
const { seatAvailability } = useSeats()

// 视图模式: 'search' | 'table'
const viewMode = ref<'search' | 'table'>('search')

// 当前选中的桌子
const selectedTable = ref<'A' | 'B' | 'C'>('A')

// 搜索关键词
const searchQuery = ref('')
const debouncedSearchQuery = ref('') // 防抖后的搜索关键词
const isSearching = ref(false) // 搜索加载状态

// 为搜索添加防抖（300ms）
const updateSearch = (value: string) => {
  isSearching.value = true
  // 模拟搜索延迟，给用户明确的加载反馈
  debouncedSearchQuery.value = value
  isSearching.value = false
}

// 监听 searchQuery 变化，触发防抖更新
watch(searchQuery, (newValue) => {
  if (newValue) {
    updateSearch(newValue)
  } else {
    // 如果搜索框为空，立即清空结果
    debouncedSearchQuery.value = ''
    isSearching.value = false
  }
})

// ========== 计算属性 ==========
const filteredPartners = computed(() => {
  // 只有在防抖后的值存在时才计算
  if (!debouncedSearchQuery.value) return []
  const query = debouncedSearchQuery.value.trim()

  if (!seatAvailability.value) return []

  // 1. 提取并去重
  const uniquePartners = seatAvailability.value
    .filter((s) => s.bookingUserInfo)
    .reduce((acc, current) => {
      const userInfo = current.bookingUserInfo
      if (!acc.some((p) => p.id === userInfo.userId)) {
        acc.push({
          id: userInfo.userId,
          fullName: userInfo.fullName,
          username: userInfo.username,
        })
      }
      return acc
    }, [] as any[])

  // 2. 使用 PinyinMatch 进行极速匹配
  return uniquePartners.filter((p) => {
    // PinyinMatch.match 会同时匹配：中文、全拼、首字母、甚至拼音的一部分
    // 如果匹配成功，它会返回一个数组 [开始索引, 结束索引]，否则返回 false
    return PinyinMatch.match(p.fullName, query) || PinyinMatch.match(p.username, query)
  })
})
/**
 * 增强版高亮逻辑：支持拼音匹配汉字高亮
 */
const highlightMatch = (text: string, query: string) => {
  if (!query) return { before: text, match: '', after: '' }

  // PinyinMatch.match 返回匹配到的 [开始索引, 结束索引]
  const result = PinyinMatch.match(text, query)

  if (result) {
    const [start, end] = result
    return {
      before: text.slice(0, start),
      match: text.slice(start, end + 1), // 这里的 end 是包含在内的索引
      after: text.slice(end + 1),
    }
  }

  return { before: text, match: '', after: '' }
}

// 左侧座位
const leftSeats = computed(() => {
  return tableSeatMap.value.filter((_, index) => index < tableSeatMap.value.length / 2)
})

// 右侧座位
const rightSeats = computed(() => {
  return tableSeatMap.value.filter((_, index) => index >= tableSeatMap.value.length / 2)
})

// ========== 事件处理层 ==========

// 选择伙伴（从搜索）
const selectPartnerFromSearch = (partner: Partner) => {
  // 修复问题2: 查找伙伴座位时，点击名称不应记录到邀请伙伴列表
  // 查找伙伴座位的目的是在座位图上高亮显示该伙伴的位置

  // 查找该伙伴预订的座位信息，以确保 partner.seat 字段存在
  // 注意：这里的 partner.id 应该对应 bookingUserInfo.userId
  const seatInfo = seatAvailability.value.find((s) => s.bookingUserInfo?.userId === partner.id)

  if (seatInfo) {
    // 修复问题1: 点击名称后，并未在座位上显示对应的 Tooltip
    // 确保传递给父组件的 partner 对象包含 seat 字段 (前端座位号)
    emit('select-partner', { ...partner, seat: seatInfo.seatNumber })
  } else {
    // 如果没有找到座位信息，仍然发送 partner，但 seat 字段可能为空
    emit('select-partner', partner)
  }

  // 清空搜索框并关闭模态框
  searchQuery.value = ''
  close() // 立即关闭模态框，因为点击的目的是查看位置，而不是邀请
}

// 切换到桌子视图
const showTableView = () => {
  viewMode.value = 'table'
}

// 返回搜索视图
const backToSearch = () => {
  viewMode.value = 'search'
}

// 切换桌子
const switchTable = (table: 'A' | 'B' | 'C') => {
  selectedTable.value = table
}

// 关闭模态框
const close = () => {
  emit('update:visible', false)
  // 重置状态
  viewMode.value = 'search'
  searchQuery.value = ''
}

// 确认选择
const confirm = () => {
  emit('confirm')
  close()
}

// C 区自定义路径常量
const TABLE_C_SVG_PATH =
  'M12.7307 1.73203L8.51711 4.1648L5.80667 2.60131C5.04605 2.16064 4.09831 2.70996 4.09831 3.59131V6.71828L1.81042 8.0403C0.729861 8.66208 0.729861 10.2256 1.81042 10.8534L4.09831 12.1754V15.3024C4.09831 16.1777 5.04605 16.727 5.80667 16.2924L8.51711 14.7289L12.7307 17.1616C13.8112 17.7834 15.1634 17.0047 15.1634 15.7551V3.1446C15.1634 1.89502 13.8112 1.11628 12.7307 1.73806V1.73203Z'

/**
 * 生成 A/B 区半圆路径
 * @param isLeft 是否为左侧座位（开口方向不同）
 */
const getSemicirclePath = (isLeft: boolean): string => {
  // 宽度16, 高度16, 半径8
  return isLeft
    ? `M 16 0 h -8 a 8 8 0 0 0 0 16 h 8 z` // 左侧：圆弧在左
    : `M 0 0 h 8 a 8 8 0 0 1 0 16 h -8 z` // 右侧：圆弧在右
}

const tableHeight = computed(() => {
  const leftCount = leftSeats.value.length
  const rightCount = rightSeats.value.length
  const maxCount = Math.max(leftCount, rightCount)

  // 参照配置：通常间距是 36-40px，加上上下 padding
  return maxCount * 33
})

// 重置状态当模态框关闭
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      viewMode.value = 'search'
      searchQuery.value = ''
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end justify-center"
        style="
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.62) 0%,
            rgba(102, 102, 102, 0.62) 100%
          );
          backdrop-filter: blur(12.5px);
        "
        @click.self="close"
      >
        <!-- 主模态框容器 -->
        <!-- 主模态框容器 -->
        <div
          class="w-full max-w-[600px] rounded-t-[45px] bg-success px-6 pb-12 pt-10 animate-slide-up"
        >
          <!-- 标题 -->
          <h2
            class="text-2xl font-medium text-white text-center mb-6 leading-[100%] tracking-[-0.24px]"
          >
            Find Partner
          </h2>

          <!-- 搜索视图 -->
          <div v-if="viewMode === 'search'" class="space-y-4">
            <!-- 时间段选择器（仅在多时段模式下显示） -->
            <div
              v-if="selectedTimeSlots && selectedTimeSlots.length > 1"
              class="mb-4"
            >
              <label class="block text-sm font-medium text-white/90 mb-2 text-center">
                选择时间段
              </label>
              <select
                v-model="selectedTimeSlotKey"
                class="w-full px-4 py-2.5 rounded-lg border-0 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option :value="null">全部时段</option>
                <option
                  v-for="slot in selectedTimeSlots"
                  :key="slot.key"
                  :value="slot.key"
                >
                  {{ slot.date }} {{ slot.time }}
                </option>
              </select>
            </div>

            <!-- 搜索框 -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder=""
                class="w-full h-[47px] px-4 rounded-lg border-0 text-base font-medium leading-[100%] tracking-[-0.16px] focus:outline-none focus:ring-2 focus:ring-white bg-white"
              />
            </div>

            <!-- 搜索加载状态 -->
            <div v-if="isSearching" class="bg-white rounded-lg p-4 text-center">
              <div class="text-gray-500 text-sm">搜索中...</div>
            </div>
            <div v-if="isSearching" class="bg-white rounded-lg overflow-hidden shadow-xl">
              <button
                class="w-full text-left px-4 py-4 text-base font-medium text-gray-400 animate-pulse"
              >
                Searching...
              </button>
            </div>
            <!-- 搜索结果列表 -->
            <div
              v-else-if="searchQuery && filteredPartners.length > 0"
              class="bg-white rounded-lg overflow-hidden"
            >
              <button
                v-for="partner in filteredPartners"
                :key="partner.id"
                @click="selectPartnerFromSearch(partner)"
                class="w-full text-left px-4 py-3 text-base font-medium hover:bg-success/10 transition-colors leading-[100%] tracking-[-0.16px] border-b border-gray-100 last:border-0"
              >
                <span class="text-black">{{
                  highlightMatch(partner.fullName, searchQuery).before
                }}</span>
                <span class="text-success font-semibold">{{
                  highlightMatch(partner.fullName, searchQuery).match
                }}</span>
                <span class="text-black">{{
                  highlightMatch(partner.fullName, searchQuery).after
                }}</span>
              </button>
            </div>

            <div
              v-else-if="searchQuery && !isSearching"
              class="bg-white rounded-lg overflow-hidden mb-8 shadow-xl"
            >
              <div
                class="w-full text-left px-4 py-3 text-base font-medium leading-[100%] tracking-[-0.16px] text-gray-400"
              >
                当前时间段无该用户
              </div>
            </div>

            <!-- "查看全部" 按钮 -->
            <div class="text-center pt-2">
              <button
                @click="showTableView"
                class="text-base font-medium text-white leading-[100%] tracking-[-0.16px] hover:underline"
              >
                Show All
              </button>
            </div>
          </div>

          <!-- 桌子视图 -->
          <div v-else class="flex flex-col">
            <!-- 时间段选择器（桌子视图，仅在多时段模式下显示） -->
            <div
              v-if="selectedTimeSlots && selectedTimeSlots.length > 1"
              class="mb-3"
            >
              <label class="block text-sm font-medium text-white/90 mb-2 text-center">
                选择时间段
              </label>
              <select
                v-model="selectedTimeSlotKey"
                class="w-full px-4 py-2.5 rounded-lg border-0 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option :value="null">全部时段</option>
                <option
                  v-for="slot in selectedTimeSlots"
                  :key="slot.key"
                  :value="slot.key"
                >
                  {{ slot.date }} {{ slot.time }}
                </option>
              </select>
            </div>

            <div class="flex w-full h-[48px]">
              <button
                v-for="table in ['A', 'B', 'C']"
                :key="table"
                @click="switchTable(table as 'A' | 'B' | 'C')"
                :class="[
                  'flex-1 text-base font-medium  border-t border-l border-r rounded-t-2xl relative',
                  selectedTable === table
                    ? 'bg-white text-success  z-30 -mb-[1px]' // 选中：白色背景，z-index高，-mb-[1px] 覆盖下方边框线
                    : 'bg-transparent text-white/70 border-transparent z-10 hover:text-white', // 未选中：透明
                ]"
              >
                Table {{ table }}
              </button>
            </div>

            <div
              class="bg-white p-8 min-h-[260px] shadow-sm relative z-20"
              :class="[
                'rounded-2xl', // 基础圆角
                selectedTable === 'A' ? 'rounded-tl-none' : '', // 选中A，左上变直角
                selectedTable === 'C' ? 'rounded-tr-none' : '', // 选中C，右上变直角
              ]"
            >
              <div class="flex items-center justify-center min-h-[200px]">
                <div class="flex-1 space-y-3 pr-4">
                  <div
                    v-for="(item, index) in leftSeats"
                    :key="`left-${index}`"
                    class="flex items-center justify-end gap-3 h-6"
                  >
                    <!-- 组标识（如果有组） -->
                    <div
                      v-if="!item.isAvailable && item.groupId !== undefined"
                      class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      :style="{ backgroundColor: item.groupColor }"
                    >
                      <span class="text-[10px] font-bold text-white">{{ item.groupId }}</span>
                    </div>

                    <span
                      class="text-sm font-medium text-right"
                      :class="item.isAvailable ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ item.partner?.fullName || item.seat }}
                    </span>

                    <svg width="16" height="16" viewBox="0 0 16 16" class="flex-shrink-0">
                      <path
                        :d="selectedTable === 'C' ? TABLE_C_SVG_PATH : getSemicirclePath(true)"
                        :fill="!item.isAvailable && item.groupColor ? item.groupColor : (item.isAvailable ? '#E5E7EB' : '#10B981')"
                      />
                    </svg>
                  </div>
                </div>

                <div
                  class="w-14 bg-gray-100 rounded-md border border-gray-200/60 flex items-center justify-center relative shadow-"
                  :style="{ height: `${tableHeight}px` }"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-[12px] font-bold text-gray-400 uppercase tracking-tighter">{{
                      selectedTable
                    }}</span>
                  </div>
                  <div
                    class="absolute inset-y-8 left-1/2 w-px bg-gray-200/50 -translate-x-1/2"
                  ></div>
                </div>

                <div class="flex-1 space-y-3 pl-4">
                  <div
                    v-for="(item, index) in rightSeats"
                    :key="`right-${index}`"
                    class="flex items-center justify-start gap-3 h-6"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" class="flex-shrink-0">
                      <path
                        :d="selectedTable === 'C' ? TABLE_C_SVG_PATH : getSemicirclePath(false)"
                        :fill="!item.isAvailable && item.groupColor ? item.groupColor : (item.isAvailable ? '#E5E7EB' : '#10B981')"
                      />
                    </svg>

                    <span
                      class="text-sm font-medium text-left"
                      :class="item.isAvailable ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ item.partner?.fullName || item.seat }}
                    </span>

                    <!-- 组标识（如果有组） -->
                    <div
                      v-if="!item.isAvailable && item.groupId !== undefined"
                      class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      :style="{ backgroundColor: item.groupColor }"
                    >
                      <span class="text-[10px] font-bold text-white">{{ item.groupId }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- "返回搜索" 按钮 -->
            <div class="flex items-center justify-center gap-2 pt-8">
              <svg
                width="9"
                height="18"
                viewBox="0 0 9 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.8475 16.59L1.3275 10.07C0.5575 9.3 0.5575 8.04 1.3275 7.27L7.8475 0.75"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-miterlimit="10"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <button
                @click="backToSearch"
                class="text-base font-medium text-white leading-[100%] tracking-[-0.16px] hover:underline"
              >
                Back to Search
              </button>
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div class="flex gap-3 mt-8">
            <button
              @click="close"
              class="flex-1 h-12 rounded-xl border-2 border-white text-white text-base font-medium leading-[100%] tracking-[-0.16px] hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              @click="confirm"
              class="flex-1 h-12 rounded-xl border-2 border-white bg-white text-success text-base font-medium leading-[100%] tracking-[-0.16px] hover:opacity-90 transition-opacity"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 模态框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.modal-leave-active .animate-slide-up {
  animation: slide-down 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}
</style>
