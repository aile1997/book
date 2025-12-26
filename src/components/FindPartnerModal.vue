<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSeats } from '../composables/useSeats'
import { usePartners } from '../composables/usePartners'
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
const { } = usePartners()
const { seats } = useSeats()

// 添加调试日志来跟踪 seats 的状态
onMounted(() => {
  console.log('FindPartnerModal mounted, seats length:', seats.value?.length || 0)
  console.log('FindPartnerModal mounted, seats content:', seats.value)
})

// 监听 seats 变化
watch(seats, (newSeats, oldSeats) => {
  console.log('Seats changed in FindPartnerModal:')
  console.log('Previous seats length:', oldSeats?.length || 0)
  console.log('Current seats length:', newSeats?.length || 0)
}, { deep: true })

// 视图模式: 'search' | 'table'
const viewMode = ref<'search' | 'table'>('search')

// 当前选中的桌子
const selectedTable = ref<'A' | 'B' | 'C'>('A')

// 搜索关键词
const searchQuery = ref('')

// ========== 计算属性 ==========

// 过滤后的伙伴列表（基于搜索）
const filteredPartners = computed(() => {
  if (!searchQuery.value) return []
  const lowerQuery = searchQuery.value.toLowerCase()

  // 1. 从 seats.value 中提取已预订的伙伴信息
  if (!seats.value || seats.value.length === 0) {
    console.warn('Seats array is empty, cannot search for partners')
    return []
  }
  const occupiedPartners: Partner[] = seats.value
    .filter((s) => s.occupiedBy) // 筛选出已预订的座位
    .map((s) => ({
      id: s.backendSeatId, // 使用 backendSeatId 作为 id
      username: s.occupiedBy || `User ${s.id}`, // 使用 occupiedBy 作为用户名
      fullName: s.occupiedBy || s.id, // 使用 occupiedBy 作为全名
      email: '', // 无法从座位信息中获取，暂时留空
    }))

  // 2. 去重并过滤
  const uniquePartners = occupiedPartners.reduce((acc, current) => {
    if (!acc.some((p) => p.id === current.id)) {
      acc.push(current)
    }
    return acc
  }, [] as Partner[])

  // 3. 搜索过滤
  return uniquePartners.filter((p) => p.fullName.toLowerCase().includes(lowerQuery)).slice(0, 5)
})

// 根据桌子获取座位布局，并关联伙伴数据
const tableSeatMap = computed(() => {
  // 用户的要求是：桌子和座位的布局渲染是通过之前的 /api/v1/seats/map 这个接口获取的。
  // useSeats.seats.value 已经包含了完整的座位布局和当前的可用性状态。
  // 因此，我们应该直接从 useSeats.seats.value 中过滤出当前桌子的座位。

  // 1. 过滤出当前桌子的座位
  if (!seats.value || seats.value.length === 0) {
    console.warn('Seats array is empty, cannot map table seats')
    return []
  }
  const currentTableSeats = seats.value.filter((s) => s.table === selectedTable.value)

  // 2. 映射为 FindPartnerModal 所需的结构
  return currentTableSeats.map((seat) => ({
    seat: seat.id,
    // 伙伴信息应该从 seat.occupiedBy 中提取
    partner: seat.occupiedBy
      ? {
          id: seat.backendSeatId, // 使用 backendSeatId 作为 id
          username: seat.occupiedBy, // 使用 occupiedBy 作为用户名
          fullName: seat.occupiedBy, // 使用 occupiedBy 作为全名
          email: '', // 暂时留空
        }
      : null,
    // 状态直接使用 seat.status
    status: seat.status === 'available' ? 'available' : 'occupied',
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
  const selected = [...props.selectedPartners]
  if (!selected.some((p) => p.id === partner.id)) {
    selected.push(partner)
    emit('update:selectedPartners', selected)
  }
  // 发送选中的伙伴用于在地图上高亮
  // 查找该伙伴预订的座位信息，以确保 partner.seat 字段存在
  const seatInfo = seats.value.find(s => s.bookingUserInfo?.userId === partner.id)
  if (seatInfo) {
    emit('select-partner', { ...partner, seat: seatInfo.id })
  } else {
    // 如果没有找到座位信息，仍然发送 partner，但 seat 字段可能为空
    emit('select-partner', partner)
  }
  searchQuery.value = ''
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

            <!-- 搜索结果列表 -->
            <div v-if="filteredPartners.length > 0" class="bg-white rounded-lg overflow-hidden">
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
                      :class="item.status === 'available' ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ item.partner?.fullName || item.seat }}
                    </span>
                    <div
                      class="w-4 h-4 rounded-sm flex-shrink-0"
                      :class="item.status === 'available' ? 'bg-gray-200' : 'bg-success'"
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
                      :class="item.status === 'available' ? 'bg-gray-200' : 'bg-success'"
                    ></div>
                    <span
                      class="text-sm font-medium text-left transition-colors"
                      :class="item.status === 'available' ? 'text-gray-300' : 'text-gray-700'"
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