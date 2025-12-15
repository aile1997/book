<script setup lang="ts">
import { computed } from 'vue'
import SeatMap from './SeatMap.vue'
import type { Seat } from '../types/booking'

interface Props {
  visible: boolean
  seats: Seat[]
  selectedSeat: string | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select-seat', seatId: string): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 选择座位处理
const handleSeatSelect = (seatId: string) => {
  emit('select-seat', seatId)
}

// 确认选择
const confirm = () => {
  if (props.selectedSeat) {
    emit('confirm')
  }
}

// 关闭模态框
const close = () => {
  emit('update:visible', false)
}

// 是否可以确认（必须选中座位）
const canConfirm = computed(() => !!props.selectedSeat)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        @click.self="close"
      >
        <!-- 座位选择卡片 -->
        <div class="w-full max-w-[340px] bg-white rounded-3xl p-6 relative animate-scale-in">
          <!-- 关闭按钮 -->
          <button
            @click="close"
            class="absolute -top-16 right-0 w-12 h-12 rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L18 18M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 图例 -->
          <div class="flex items-center gap-8 mb-6">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded bg-gray-light"></div>
              <span class="text-sm font-medium text-white">Occupied</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded bg-success"></div>
              <span class="text-sm font-medium text-white">Available</span>
            </div>
          </div>

          <!-- 座位地图 -->
          <SeatMap
            :seats="seats"
            :selected-seat="selectedSeat"
            @select-seat="handleSeatSelect"
          />

          <!-- 当前选择 -->
          <div v-if="selectedSeat" class="mt-6 text-center">
            <div class="text-sm font-medium text-gray-dark mb-2">Your Seat</div>
            <div class="text-4xl font-semibold text-gray-dark">{{ selectedSeat }}</div>
          </div>

          <!-- 确认按钮 -->
          <button
            @click="confirm"
            :disabled="!canConfirm"
            class="w-full mt-6 h-12 rounded-lg bg-success text-white text-base font-medium leading-[100%] tracking-[-0.16px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
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

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}

@keyframes scale-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
