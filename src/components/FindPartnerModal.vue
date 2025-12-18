<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePartners, useSeats } from '../composables/useSeats'
import type { Partner } from '../types/booking'

interface Props {
  visible: boolean
  selectedPartners: string[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedPartners', value: string[]): void
  (e: 'confirm'): void
  (e: 'select-partner', partner: Partner): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 数据层 ==========

// 使用伙伴管理组合式函数
const { allPartners, getPartnersByTable, searchPartners } = usePartners()
const { seats } = useSeats()

// 视图模式: 'search' | 'table'
const viewMode = ref<'search' | 'table'>('search')

// 当前选中的桌子
const selectedTable = ref<'A' | 'B' | 'C'>('A')

// 搜索关键词
const searchQuery = ref('')

// 选中的伙伴（用于高亮显示）
const selectedPartnerForHighlight = ref<Partner | null>(null)

// ========== 计算属性 ==========

// 过滤后的伙伴列表（基于搜索）
const filteredPartners = computed(() => {
  if (!searchQuery.value) return []
  return searchPartners(searchQuery.value).slice(0, 5)
})

// 根据桌子获取伙伴，并关联座位状态
const partnersByTable = computed(() => {
  const tablePartners = getPartnersByTable(selectedTable.value)
  // 获取该桌子的所有座位
  const tableSeats = seats.value.filter(s => s.table === selectedTable.value)
  
  // 创建座位到伙伴的映射
  const seatPartnerMap: { seat: string; partner: Partner | null; status: 'available' | 'occupied' }[] = []
  
  tableSeats.forEach(seat => {
    const partner = tablePartners.find(p => p.seat === seat.id)
    seatPartnerMap.push({
      seat: seat.id,
      partner: partner || null,
      status: seat.status === 'available' ? 'available' : 'occupied'
    })
  })
  
  return seatPartnerMap
})

// 左侧座位
const leftSeats = computed(() => {
  return partnersByTable.value.filter((_, index) => index < partnersByTable.value.length / 2)
})

// 右侧座位
const rightSeats = computed(() => {
  return partnersByTable.value.filter((_, index) => index >= partnersByTable.value.length / 2)
})

// ========== 事件处理层 ==========

// 选择伙伴（从搜索）
const selectPartnerFromSearch = (partner: Partner) => {
  const selected = [...props.selectedPartners]
  if (!selected.includes(partner.name)) {
    selected.push(partner.name)
    emit('update:selectedPartners', selected)
  }
  // 发送选中的伙伴用于在地图上高亮
  emit('select-partner', partner)
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
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    viewMode.value = 'search'
    searchQuery.value = ''
  }
})
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
                <span class="text-black">{{ highlightMatch(partner.name, searchQuery).before }}</span>
                <span class="text-success font-semibold">{{ highlightMatch(partner.name, searchQuery).match }}</span>
                <span class="text-black">{{ highlightMatch(partner.name, searchQuery).after }}</span>
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
          <div v-else class="space-y-4">
            <!-- 桌子选项卡 -->
            <div class="flex items-center bg-white rounded-lg overflow-hidden">
              <button
                v-for="table in ['A', 'B', 'C']"
                :key="table"
                @click="switchTable(table as 'A' | 'B' | 'C')"
                :class="[
                  'flex-1 py-3 text-base font-medium leading-[100%] tracking-[-0.16px] transition-all',
                  selectedTable === table
                    ? 'text-success bg-white'
                    : 'text-white/70 bg-success hover:text-white',
                ]"
              >
                Table {{ table }}
              </button>
            </div>

            <!-- 桌子座位视图 -->
            <div class="bg-white rounded-lg p-6 min-h-[240px]">
              <div class="flex">
                <!-- 左侧座位列 -->
                <div class="flex-1 space-y-3 pr-4">
                  <div 
                    v-for="(item, index) in leftSeats" 
                    :key="`left-${index}`" 
                    class="flex items-center gap-3"
                  >
                    <span 
                      class="text-sm font-medium text-right min-w-[80px]"
                      :class="item.status === 'available' ? 'text-gray-400' : 'text-gray-700'"
                    >
                      {{ item.partner?.name || '' }}
                    </span>
                    <div
                      class="w-4 h-4 rounded-sm flex-shrink-0"
                      :class="item.status === 'available' ? 'bg-success' : 'bg-gray-300'"
                    ></div>
                  </div>
                </div>

                <!-- 桌子分隔线 -->
                <div class="w-px bg-gray-200 mx-2"></div>

                <!-- 右侧座位列 -->
                <div class="flex-1 space-y-3 pl-4">
                  <div 
                    v-for="(item, index) in rightSeats" 
                    :key="`right-${index}`" 
                    class="flex items-center gap-3"
                  >
                    <div
                      class="w-4 h-4 rounded-sm flex-shrink-0"
                      :class="item.status === 'available' ? 'bg-success' : 'bg-gray-300'"
                    ></div>
                    <span 
                      class="text-sm font-medium"
                      :class="item.status === 'available' ? 'text-gray-400' : 'text-gray-700'"
                    >
                      {{ item.partner?.name || '' }}
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
