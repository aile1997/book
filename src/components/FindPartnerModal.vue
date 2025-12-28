<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSeats } from '../composables/useSeats'
import { usePartners } from '../composables/usePartners'
import { debounce } from '../utils/debounce'
import type { Partner } from '../types/booking'

interface Props {
  visible: boolean
  selectedPartners: Partner[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedPartners', value: Partner[]): void
  (e: 'confirm'): void
  (e: 'select-partner', partner: Partner): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 数据层 ==========

// 使用伙伴管理组合式函数
const {} = usePartners()
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
const updateSearch = debounce((value: string) => {
  isSearching.value = true
  // 模拟搜索延迟，给用户明确的加载反馈
  debouncedSearchQuery.value = value
  isSearching.value = false
}, 300)

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

// 过滤后的伙伴列表（基于搜索）
const filteredPartners = computed(() => {
  if (!debouncedSearchQuery.value) return []
  const lowerQuery = debouncedSearchQuery.value.toLowerCase()

  // 1. 从 seatAvailability.value 中提取已预订的伙伴信息
  if (!seatAvailability.value || seatAvailability.value.length === 0) {
    console.warn('Seats array is empty, cannot search for partners')
    return []
  }
  const occupiedPartners: Partner[] = seatAvailability.value
    .filter((s) => s.bookingUserInfo) // 筛选出已预订的座位
    .map((s) => ({
      id: s.bookingUserInfo.userId,
      username: s.bookingUserInfo.username,
      fullName: s.bookingUserInfo.fullName,
      email: '',
    }))

  // 2. 去重并过滤
  const uniquePartners = occupiedPartners.reduce((acc, current) => {
    if (!acc.some((p) => p.id === current.id)) {
      acc.push(current)
    }
    return acc
  }, [] as Partner[])

  // 3. 搜索过滤
  return uniquePartners.filter((p) => p.fullName.toLowerCase().includes(lowerQuery))
})

// 根据桌子获取座位布局，并关联伙伴数据
const tableSeatMap = computed(() => {
  // 1. 过滤出当前桌子的座位
  if (!seatAvailability.value || seatAvailability.value.length === 0) {
    console.warn('Seats array is empty, cannot map table seatAvailability')
    return []
  }
  const currentTableSeats = seatAvailability.value.filter((s) => s.table === selectedTable.value)

  // 2. 映射为 FindPartnerModal 所需的结构
  return currentTableSeats.map((seat) => ({
    seat: seat.seatNumber,
    partner: seat.bookingUserInfo
      ? {
          id: seat.bookingUserInfo.userId,
          username: seat.bookingUserInfo.username,
          fullName: seat.bookingUserInfo.fullName,
          email: '', // 暂时留空
        }
      : null,
    // 状态直接使用 seat.isAvailable
    isAvailable: seat.isAvailable,
  }))
})

// 左侧座位
const leftSeats = computed(() => {
  // 假设座位列表已在 usePartners 中排序，左侧座位是前半部分
  return tableSeatMap.value.filter((_, index) => index < tableSeatMap.value.length / 2)
})

// 右侧座位
const rightSeats = computed(() => {
  // 右侧座位是后半部分
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

// 高亮搜索文本
const highlightMatch = (text: string, query: string) => {
  if (!query) return { before: text, match: '', after: '' }
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return { before: text, match: '', after: '' }

  return {
    before: text.slice(0, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length),
  }
}

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
          class="w-full max-w-[600px] rounded-t-[45px] bg-success px-6 pb-8 pt-10 animate-slide-up"
        >
          <!-- 标题 -->
          <h2
            class="text-2xl font-medium text-white text-center mb-8 leading-[100%] tracking-[-0.24px]"
          >
            Find Partner
          </h2>

          <!-- 搜索视图 -->
          <div v-if="viewMode === 'search'" class="space-y-4">
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

            <!-- 搜索结果列表 -->
            <div
              v-else-if="filteredPartners.length > 0"
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
            <div class="flex w-full h-[48px]">
              <button
                v-for="table in ['A', 'B', 'C']"
                :key="table"
                @click="switchTable(table as 'A' | 'B' | 'C')"
                :class="[
                  'flex-1 text-base font-medium  border-t border-l border-r rounded-t-2xl relative',
                  selectedTable === table
                    ? 'bg-white text-success border-gray-200 z-30 -mb-[1px]' // 选中：白色背景，z-index高，-mb-[1px] 覆盖下方边框线
                    : 'bg-transparent text-white/70 border-transparent z-10 hover:text-white', // 未选中：透明
                ]"
              >
                Table {{ table }}
              </button>
            </div>

            <div
              class="bg-white border border-gray-200 p-8 min-h-[280px] shadow-sm relative z-20"
              :class="[
                'rounded-2xl', // 基础圆角
                selectedTable === 'A' ? 'rounded-tl-none' : '', // 选中A，左上变直角
                selectedTable === 'C' ? 'rounded-tr-none' : '', // 选中C，右上变直角
              ]"
            >
              <div class="flex">
                <div class="flex-1 space-y-3 pr-4">
                  <div
                    v-for="(item, index) in leftSeats"
                    :key="`left-${index}`"
                    class="flex items-center justify-end gap-3 h-6"
                  >
                    <span
                      class="text-sm font-medium text-right transition-colors"
                      :class="item.isAvailable === true ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ item.partner?.fullName || item.seat }}
                    </span>
                    <div
                      class="w-4 h-4 rounded-sm flex-shrink-0"
                      :class="item.isAvailable === true ? 'bg-gray-200' : 'bg-success'"
                    ></div>
                  </div>
                </div>

                <div class="w-px bg-gray-200 mx-2"></div>

                <div class="flex-1 space-y-3 pl-4">
                  <div
                    v-for="(item, index) in rightSeats"
                    :key="`right-${index}`"
                    class="flex items-center justify-start gap-3 h-6"
                  >
                    <div
                      class="w-4 h-4 rounded-sm flex-shrink-0"
                      :class="item.isAvailable === true ? 'bg-gray-200' : 'bg-success'"
                    ></div>
                    <span
                      class="text-sm font-medium text-left transition-colors"
                      :class="item.isAvailable === true ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ item.partner?.fullName || item.seat }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- "返回搜索" 按钮 -->
            <div class="flex items-center justify-center gap-2 pt-2">
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
              class="flex-1 h-12 rounded-full border-2 border-white text-white text-base font-medium leading-[100%] tracking-[-0.16px] hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              @click="confirm"
              class="flex-1 h-12 rounded-full border-2 border-white bg-white text-success text-base font-medium leading-[100%] tracking-[-0.16px] hover:opacity-90 transition-opacity"
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
