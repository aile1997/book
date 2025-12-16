<script setup lang="ts">
import { ref, computed } from 'vue'
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
  (e: 'find-partner'): void
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
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
          <div class="flex items-center justify-between mb-6">
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
              class="w-12 h-12 rounded-full bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
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
          <div class="bg-white rounded-3xl p-6">
            <!-- 座位地图 -->
            <SeatMap :seats="seats" :selected-seat="selectedSeat" @select-seat="handleSeatSelect" />
          </div>

          <!-- 当前选择和操作 -->
          <div v-if="selectedSeat" class="mt-6 text-center">
            <div class="text-sm font-medium text-white mb-2 tracking-tight">Your Seat</div>
            <div class="text-5xl font-semibold text-white mb-6 tracking-tight">
              {{ selectedSeat }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-3">
              <!-- 查找伙伴按钮 -->
              <button
                @click="openFindPartner"
                class="w-14 h-14 rounded-xl bg-gray-dark flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.7322 14.4564C10.5895 14.794 9.239 14.9498 7.6547 14.9498H-0.136667C-1.72104 14.9498 -3.07146 14.794 -4.21417 14.4564C-3.92846 11.0801 -0.461458 8.41797 3.759 8.41797C7.97946 8.41797 11.4465 11.0801 11.7322 14.4564Z"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    transform="translate(8, 4)"
                  />
                  <path
                    d="M8.4079 0.120117C8.4079 2.69137 6.33023 4.78195 3.759 4.78195C1.18775 4.78195 -0.889917 2.69137 -0.889917 0.120117C-0.889917 -2.45112 1.18775 -4.54879 3.759 -4.54879C6.33023 -4.54879 8.4079 -2.45112 8.4079 0.120117Z"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    transform="translate(8, 8)"
                  />
                  <circle cx="19" cy="9" r="2.5" stroke="white" stroke-width="1.5" />
                  <line
                    x1="17"
                    y1="11"
                    x2="14"
                    y2="14"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

              <!-- 确认按钮 -->
              <button
                @click="confirm"
                class="flex-1 h-14 rounded-xl bg-success text-white text-xl font-medium leading-[100%] tracking-[-1px] hover:opacity-90 transition-opacity"
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
