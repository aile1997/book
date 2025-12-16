<script setup lang="ts">
import { ref } from 'vue'
import type { Seat } from '../types/booking'

interface Props {
  seats: Seat[]
  selectedSeat: string | null
  showTooltip?: boolean
}

interface Emits {
  (e: 'select-seat', seatId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hoveredSeat = ref<string | null>(null)

const handleSeatClick = (seat: Seat) => {
  if (seat.status === 'available' || seat.status === 'selected') {
    emit('select-seat', seat.id)
  }
}

const getSeatColor = (seat: Seat): string => {
  if (seat.status === 'selected') return '#A78BFA'
  if (seat.status === 'available') return '#6FCF97'
  return '#CCCCCC'
}

const getSeatsByTable = (table: 'A' | 'B' | 'C', position: 'left' | 'right') => {
  return props.seats.filter((s) => s.table === table && s.position === position)
}

const getSeatY = (index: number): number => {
  return index * 24
}

const isSeatSelected = (seatId: string): boolean => {
  return props.selectedSeat === seatId
}
</script>

<template>
  <div class="relative w-full max-w-[280px] mx-auto">
    <!-- 使用Figma背景图 -->
    <div class="relative bg-white rounded-3xl overflow-hidden">
      <!-- 背景图片 -->
      <div class="absolute inset-0">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fba330a36648e404593d78d4f8e39b3f7%2F046d56b94b0b4ace891aac85a8891701?format=webp&width=800"
          alt=""
          class="w-full h-full object-contain"
        />
      </div>

      <!-- 座位层 (覆盖在背景上) -->
      <div class="relative" style="padding-top: 168%">
        <svg
          viewBox="0 0 218 367"
          class="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 区域 A - 左侧座位 -->
          <g id="area-a-left">
            <g v-for="seat in getSeatsByTable('A', 'left')" :key="seat.id">
              <path
                :d="`M 8 ${88 + getSeatY(seat.index)} h 12 v 12 h -12 a 6 6 0 0 1 0 -12 z`"
                :fill="getSeatColor(seat)"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              />
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="14" :cy="88 + getSeatY(seat.index) + 6" r="5" fill="white" />
                <path
                  :d="`M 12 ${88 + getSeatY(seat.index) + 6} L 13.5 ${88 + getSeatY(seat.index) + 7.5} L 16 ${88 + getSeatY(seat.index) + 4.5}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 A - 右侧座位 -->
          <g id="area-a-right">
            <g v-for="seat in getSeatsByTable('A', 'right')" :key="seat.id">
              <path
                :d="`M 62 ${88 + getSeatY(seat.index)} h 12 a 6 6 0 0 1 0 12 h -12 z`"
                :fill="getSeatColor(seat)"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              />
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="68" :cy="88 + getSeatY(seat.index) + 6" r="5" fill="white" />
                <path
                  :d="`M 66 ${88 + getSeatY(seat.index) + 6} L 67.5 ${88 + getSeatY(seat.index) + 7.5} L 70 ${88 + getSeatY(seat.index) + 4.5}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 B - 左侧座位 -->
          <g id="area-b-left">
            <g v-for="seat in getSeatsByTable('B', 'left').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M 96 ${88 + getSeatY(seat.index)} h 12 v 12 h -12 a 6 6 0 0 1 0 -12 z`"
                :fill="getSeatColor(seat)"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              />
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="102" :cy="88 + getSeatY(seat.index) + 6" r="5" fill="white" />
                <path
                  :d="`M 100 ${88 + getSeatY(seat.index) + 6} L 101.5 ${88 + getSeatY(seat.index) + 7.5} L 104 ${88 + getSeatY(seat.index) + 4.5}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 B - 右侧座位 -->
          <g id="area-b-right">
            <g v-for="seat in getSeatsByTable('B', 'right').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M 155 ${88 + getSeatY(seat.index)} h 12 a 6 6 0 0 1 0 12 h -12 z`"
                :fill="getSeatColor(seat)"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              />
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="161" :cy="88 + getSeatY(seat.index) + 6" r="5" fill="white" />
                <path
                  :d="`M 159 ${88 + getSeatY(seat.index) + 6} L 160.5 ${88 + getSeatY(seat.index) + 7.5} L 163 ${88 + getSeatY(seat.index) + 4.5}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 C - 左侧座位 -->
          <g id="area-c-left">
            <g v-for="seat in getSeatsByTable('C', 'left').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M 96 ${160 + getSeatY(seat.index)} h 12 v 12 h -12 a 6 6 0 0 1 0 -12 z`"
                :fill="getSeatColor(seat)"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              />
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="102" :cy="160 + getSeatY(seat.index) + 6" r="5" fill="white" />
                <path
                  :d="`M 100 ${160 + getSeatY(seat.index) + 6} L 101.5 ${160 + getSeatY(seat.index) + 7.5} L 104 ${160 + getSeatY(seat.index) + 4.5}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 C - 右侧座位 -->
          <g id="area-c-right">
            <g v-for="seat in getSeatsByTable('C', 'right').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M 155 ${160 + getSeatY(seat.index)} h 12 a 6 6 0 0 1 0 12 h -12 z`"
                :fill="getSeatColor(seat)"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              />
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="161" :cy="160 + getSeatY(seat.index) + 6" r="5" fill="white" />
                <path
                  :d="`M 159 ${160 + getSeatY(seat.index) + 6} L 160.5 ${160 + getSeatY(seat.index) + 7.5} L 163 ${160 + getSeatY(seat.index) + 4.5}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>
