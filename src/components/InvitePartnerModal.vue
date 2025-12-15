<script setup lang="ts">
import { ref, computed } from 'vue'

interface Partner {
  id: string
  name: string
}

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

// 搜索关键词
const searchQuery = ref('')

// 所有可选伙伴列表
const allPartners: Partner[] = [
  { id: '1', name: 'Ethan Wei' },
  { id: '2', name: 'Eric Young Jung' },
  { id: '3', name: 'Elena Zhang' },
  { id: '4', name: 'Elsa Li' },
  { id: '5', name: 'Elsa Xu' },
]

// 过滤后的伙伴列表（基于搜索）
const filteredPartners = computed(() => {
  if (!searchQuery.value) return allPartners
  const query = searchQuery.value.toLowerCase()
  return allPartners.filter(p => p.name.toLowerCase().includes(query))
})

// 选择伙伴
const selectPartner = (partnerName: string) => {
  const selected = [...props.selectedPartners]
  if (!selected.includes(partnerName)) {
    selected.push(partnerName)
    emit('update:selectedPartners', selected)
  }
  searchQuery.value = ''
}

// 关闭模态框
const close = () => {
  emit('update:visible', false)
}

// 确认
const confirm = () => {
  emit('confirm')
  close()
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-end justify-center"
    @click.self="close"
  >
    <!-- 紫色模态框 -->
    <div class="w-full rounded-t-[45px] bg-primary-dark px-8 pb-8 pt-10 animate-slide-up">
      <h2 class="text-2xl font-medium text-white text-center mb-8 leading-[100%] tracking-[-0.24px]">
        Invite Partner
      </h2>

      <!-- 搜索框 -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="w-full h-[42px] px-3.5 rounded-lg border-0 text-sm font-medium leading-[100%] tracking-[-0.14px] focus:outline-none focus:ring-2 focus:ring-white"
        />
      </div>

      <!-- 伙伴列表 -->
      <div
        v-if="searchQuery"
        class="bg-white rounded-lg max-h-[130px] overflow-y-auto mb-6"
      >
        <button
          v-for="partner in filteredPartners"
          :key="partner.id"
          @click="selectPartner(partner.name)"
          class="w-full text-left px-3.5 py-2 text-sm font-medium hover:bg-primary-light transition-colors leading-[100%] tracking-[-0.14px]"
        >
          <span class="text-primary-dark">{{ searchQuery }}</span>
          <span class="text-black">{{ partner.name.replace(searchQuery, '') }}</span>
        </button>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-2">
        <button
          @click="close"
          class="flex-1 h-12 rounded-lg border-2 border-white text-white text-base font-medium leading-[100%] tracking-[-0.16px] hover:bg-white/10 transition-colors"
        >
          Back
        </button>
        <button
          @click="confirm"
          class="flex-1 h-12 rounded-lg border border-white bg-white text-primary-dark text-base font-medium leading-[100%] tracking-[-0.16px] hover:opacity-90 transition-opacity"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
