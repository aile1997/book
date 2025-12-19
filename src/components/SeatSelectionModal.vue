<script setup lang="ts">
import { ref, computed } from 'vue'
import SeatMap from './SeatMap.vue'
import type { Seat, Partner } from '../types/booking'

interface Props {
  visible: boolean
  seats: Seat[]
  selectedSeat: string | null
  highlightedPartner?: { name: string; seat: string } | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select-seat', seatId: string): void
  (e: 'confirm'): void
  (e: 'find-partner'): void
  (e: 'clear-highlight'): void
}

const props = withDefaults(defineProps<Props>(), {
  highlightedPartner: null,
})
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
  emit('clear-highlight')
}

// 打开查找伙伴功能
const openFindPartner = () => {
  emit('find-partner')
}

// 是否可以确认（必须选中座位）
const canConfirm = computed(() => !!props.selectedSeat)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-12"
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
        <!-- 座位选择卡片 -->
        <div class="w-full max-w-[340px] relative animate-scale-in">
          <!-- 图例和关闭按钮 -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded bg-white"></div>
                <span class="text-sm font-medium text-white">Occupied</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded bg-success"></div>
                <span class="text-sm font-medium text-white">Available</span>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <button
              @click="close"
              class="w-10 h-10 rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
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
          </div>

          <!-- 座位地图卡片 -->
          <div class="rounded-3xl">
            <!-- 座位地图 -->
            <SeatMap
              :seats="seats"
              :selected-seat="selectedSeat"
              :highlighted-partner="highlightedPartner"
              @select-seat="handleSeatSelect"
              :scale="1.2"
            />
          </div>

          <!-- 当前选择和操作 -->
          <div class="mt-3 text-center">
            <div class="text-sm font-medium text-white mb-2 tracking-tight">Your Seat</div>
            <div class="h-6 rounded-2xl flex items-center justify-center mb-4">
              <span class="text-3xl font-semibold text-white tracking-tight">
                {{ selectedSeat || '-' }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-3">
              <!-- 查找伙伴按钮 -->
              <button
                @click="openFindPartner"
                class="w-12 h-12 rounded-xl bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- 人物图标 -->
                  <circle cx="9" cy="7" r="3" stroke="white" stroke-width="1.5" />
                  <path
                    d="M3 19C3 15.134 6.13401 12 10 12H8C11.866 12 15 15.134 15 19"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <!-- 搜索图标 -->
                  <circle cx="17" cy="11" r="3" stroke="white" stroke-width="1.5" />
                  <path
                    d="M19.5 13.5L22 16"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

              <!-- 确认按钮 -->
              <button
                @click="confirm"
                :disabled="!canConfirm"
                :class="[
                  'w-2/3 h-12 rounded-xl text-white text-xl font-medium leading-[100%] tracking-[-1px] transition-all',
                  canConfirm ? 'bg-success hover:opacity-90' : 'bg-gray-400 cursor-not-allowed',
                ]"
              >
                Confirm
              </button>
            </div>
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
