<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePartners } from '../composables/usePartners' // 使用新的伙伴管理逻辑
import type { Partner } from '../types/booking'

interface Props {
  visible: boolean
  selectedPartners: Partner[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedPartners', value: Partner[]): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 数据与逻辑层 (参照 FindPartnerModal) ==========

const { searchResults, searchUsersForInvite } = usePartners()
const searchQuery = ref('')

// 1. 统一搜索逻辑：直接使用 API 搜索结果
const filteredPartners = computed(() => {
  // API 搜索结果已经限制了数量
  return searchResults.value
})

// 2. 监听搜索框变化，触发 API 搜索 (已防抖)
watch(searchQuery, (newQuery) => {
  searchUsersForInvite(newQuery)
})

// 2. 统一高亮函数：支持文字任意位置匹配
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

// 选择伙伴
const selectPartner = (partner: Partner) => {
  const selected = [...props.selectedPartners]
  // 确保将完整的 Partner 对象添加到列表中，并检查是否已存在
  if (!selected.some(p => p.id === partner.id)) {
    selected.push(partner)
    emit('update:selectedPartners', selected)
  }
  searchQuery.value = '' // 选择后清空
}

const close = () => {
  emit('update:visible', false)
}

const confirm = () => {
  emit('confirm')
  close()
}

// 监听关闭状态，重置搜索框
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      searchQuery.value = ''
      // 确保在关闭时取消任何正在进行的防抖调用
      searchUsersForInvite.cancel()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="w-full max-w-md rounded-t-[45px] bg-[#784DC7] px-8 pb-10 pt-10 animate-slide-up"
        >
          <h2
            class="text-2xl font-medium text-white text-center mb-8 leading-[100%] tracking-[-0.24px]"
          >
            Invite Partner
          </h2>

          <div class="relative mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search partner name..."
              class="w-full h-[47px] px-4 rounded-lg border-0 text-base font-medium leading-[100%] tracking-[-0.16px] focus:outline-none focus:ring-2 focus:ring-white bg-white shadow-sm"
            />
          </div>

          <div
            v-if="searchQuery && filteredPartners.length > 0"
            class="bg-white rounded-lg overflow-hidden mb-8 shadow-xl"
          >
            <button
              v-for="partner in filteredPartners"
              :key="partner.id"
              @click="selectPartner(partner)"
              :disabled="selectedPartners.includes(String(partner.id))"
              class="w-full text-left px-4 py-3 text-base font-medium hover:bg-purple-50 transition-colors leading-[100%] tracking-[-0.16px] border-b border-gray-100 last:border-0"
            >
              <span class="text-black">{{
                highlightMatch(partner.fullName, searchQuery).before
              }}</span>
              <span class="text-[#784DC7] font-bold">{{
                highlightMatch(partner.fullName, searchQuery).match
              }}</span>
              <span class="text-black">{{
                highlightMatch(partner.fullName, searchQuery).after
              }}</span>
            </button>
          </div>

          <div class="flex gap-3">
            <button
              @click="close"
              class="flex-1 h-12 rounded-full border-2 border-white text-white text-base font-medium leading-[100%] tracking-[-0.16px] hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              @click="confirm"
              class="flex-1 h-12 rounded-full border-2 border-white bg-white text-[#784DC7] text-base font-bold leading-[100%] tracking-[-0.16px] hover:opacity-90 transition-opacity"
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
