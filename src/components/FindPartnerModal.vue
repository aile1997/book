<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePartners } from '../composables/useSeats'
import type { Partner } from '../types/booking'

interface Props {
  visible: boolean
  selectedPartners: string[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedPartners', value: string[]): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 数据层 ==========

// 使用伙伴管理组合式函数
const { allPartners, getPartnersByTable, searchPartners } = usePartners()

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
  return searchPartners(searchQuery.value).slice(0, 5)
})

// 根据桌子获取伙伴
const partnersByTable = computed(() => {
  return getPartnersByTable(selectedTable.value)
})

// ========== 事件处理层 ==========

// 选择伙伴（从搜索）
const selectPartnerFromSearch = (partnerName: string) => {
  const selected = [...props.selectedPartners]
  if (!selected.includes(partnerName)) {
    selected.push(partnerName)
    emit('update:selectedPartners', selected)
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
  if (!query) return text
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text

  return {
    before: text.slice(0, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length),
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md"
        @click.self="close"
      >
        <!-- 主模态框容器 -->
        <div
          class="w-full max-w-[600px] rounded-t-[45px] bg-success px-8 pb-8 pt-12 animate-slide-up"
        >
          <!-- 关闭按钮 -->
          <button
            @click="close"
            class="absolute top-6 right-6 w-12 h-12 rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <!-- 标题 -->
          <h2
            class="text-2xl font-medium text-white text-center mb-8 leading-[100%] tracking-[-0.24px]"
          >
            Find Partner
          </h2>

          <!-- 搜索视图 -->
          <div v-if="viewMode === 'search'" class="space-y-6">
            <!-- 搜索框 -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name..."
                class="w-full h-[47px] px-4 rounded-lg border-0 text-sm font-medium leading-[100%] tracking-[-0.14px] focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <!-- 搜索结果列表 -->
            <div v-if="filteredPartners.length > 0" class="bg-white rounded-lg overflow-hidden">
              <button
                v-for="partner in filteredPartners"
                :key="partner.id"
                @click="selectPartnerFromSearch(partner.name)"
                class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-success/10 transition-colors leading-[100%] tracking-[-0.14px] border-b border-gray-light last:border-0"
              >
                <template
                  v-if="
                    highlightMatch(partner.name, searchQuery) &&
                    typeof highlightMatch(partner.name, searchQuery) === 'object'
                  "
                >
                  <span class="text-black">{{
                    (highlightMatch(partner.name, searchQuery) as any).before
                  }}</span>
                  <span class="text-success font-semibold">{{
                    (highlightMatch(partner.name, searchQuery) as any).match
                  }}</span>
                  <span class="text-black">{{
                    (highlightMatch(partner.name, searchQuery) as any).after
                  }}</span>
                </template>
                <template v-else>
                  <span class="text-black">{{ partner.name }}</span>
                </template>
              </button>
            </div>

            <!-- "查看全部" 按钮 -->
            <div class="text-center">
              <button
                @click="showTableView"
                class="text-base font-medium text-white leading-[100%] tracking-[-0.16px] hover:underline"
              >
                Show All
              </button>
            </div>
          </div>

          <!-- 桌子视图 -->
          <div v-else class="space-y-6">
            <!-- 桌子选项卡 -->
            <div class="flex items-center justify-center gap-8">
              <button
                v-for="table in ['A', 'B', 'C']"
                :key="table"
                @click="switchTable(table as 'A' | 'B' | 'C')"
                :class="[
                  'text-base font-medium leading-[100%] tracking-[-0.16px] transition-all pb-1',
                  selectedTable === table
                    ? 'text-success border-b-2 border-white'
                    : 'text-white/50 hover:text-white/80',
                ]"
              >
                Table {{ table }}
              </button>
            </div>

            <!-- 桌子座位视图 -->
            <div class="bg-white rounded-lg p-6 min-h-[240px]">
              <div class="grid grid-cols-2 gap-8">
                <!-- 左侧座位列 -->
                <div class="space-y-3">
                  <div v-for="i in 6" :key="`left-${i}`" class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-5 h-5 rounded-full"
                        :class="i <= 3 ? 'bg-gray-light' : 'bg-success'"
                      ></div>
                      <span
                        class="text-sm font-medium"
                        :class="i <= 3 ? 'text-gray' : 'text-black'"
                      >
                        {{ partnersByTable[i - 1]?.name || '-' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 桌子分隔线 -->
                <div class="border-l-2 border-gray-light"></div>

                <!-- 右侧座位列 -->
                <div class="space-y-3">
                  <div v-for="i in 6" :key="`right-${i}`" class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-5 h-5 rounded-full"
                        :class="[6, 5].includes(i) ? 'bg-success' : 'bg-gray-light'"
                      ></div>
                      <span
                        class="text-sm font-medium"
                        :class="[6, 5].includes(i) ? 'text-black' : 'text-gray'"
                      >
                        {{ partnersByTable[i + 5]?.name || '-' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- "返回搜索" 按钮 -->
            <div class="flex items-center justify-center gap-2">
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
              class="flex-1 h-12 rounded-lg border-2 border-white text-white text-base font-medium leading-[100%] tracking-[-0.16px] hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              @click="confirm"
              class="flex-1 h-12 rounded-lg border-2 border-white bg-white text-success text-base font-medium leading-[100%] tracking-[-0.16px] hover:opacity-90 transition-opacity"
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
