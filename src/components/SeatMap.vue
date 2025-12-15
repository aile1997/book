<script setup lang="ts">
import { ref, computed } from 'vue'
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

// 悬停的座位（用于显示tooltip）
const hoveredSeat = ref<string | null>(null)

// 座位点击处理
const handleSeatClick = (seat: Seat) => {
  if (seat.status === 'available' || seat.status === 'selected') {
    emit('select-seat', seat.id)
  }
}

// 获取座位颜色
const getSeatColor = (seat: Seat): string => {
  if (seat.status === 'selected') return '#A78BFA'
  if (seat.status === 'available') return '#38D87B'
  return '#EAEAEA'
}

// 根据桌子和位置获取座位
const getSeatsByTable = (table: 'A' | 'B' | 'C', position: 'left' | 'right') => {
  return props.seats.filter(s => s.table === table && s.position === position)
}

// 计算座位的Y坐标（基于索引）
const getSeatY = (index: number): number => {
  return index * 23 // 每个座位间隔23px
}

// 检查座位是否被选中
const isSeatSelected = (seatId: string): boolean => {
  return props.selectedSeat === seatId
}
</script>

<template>
  <div class="relative w-full max-w-[340px] mx-auto">
    <!-- 座位地图背景 -->
    <div class="relative bg-white rounded-3xl p-6 shadow-lg">
      <!-- 入口和设施标签 -->
      <div class="absolute top-8 left-8 text-gray text-xs font-medium">
        <div class="flex items-center gap-2 mb-6">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14L8 2M8 2L4 6M8 2L12 6" stroke="#CCCCCC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="text-gray-lighter">Entrance</span>
        </div>
      </div>

      <!-- 右侧标签 -->
      <div class="absolute top-12 right-8 text-gray text-xs font-medium space-y-8">
        <div class="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2h6v6H2V2z" fill="#CCCCCC" opacity="0.3"/>
          </svg>
          <span class="text-gray-lighter">Bar</span>
        </div>
        <div class="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2h12v8H2V2z" fill="#CCCCCC" opacity="0.3"/>
          </svg>
          <span class="text-gray-lighter">Lounge</span>
        </div>
      </div>

      <!-- 左下角标签 -->
      <div class="absolute bottom-32 left-8 flex items-center gap-2 text-gray text-xs font-medium">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2h8v8H2V2z" fill="#CCCCCC" opacity="0.3"/>
        </svg>
        <span class="text-gray-lighter">Fitness</span>
      </div>

      <!-- SVG 座位地图 -->
      <svg 
        viewBox="0 0 280 350" 
        class="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 桌子 A (左侧) -->
        <g id="table-a">
          <!-- 桌子中心线 -->
          <rect x="70" y="90" width="30" height="138" fill="#EAEAEA" rx="4"/>
          
          <!-- 桌子标签 -->
          <text x="85" y="175" text-anchor="middle" font-size="24" font-weight="500" fill="#CCCCCC">A</text>
          
          <!-- 左侧座位 -->
          <g v-for="seat in getSeatsByTable('A', 'left')" :key="seat.id">
            <path
              :d="`M 45 ${90 + getSeatY(seat.index)} 
                   C 45 ${90 + getSeatY(seat.index) - 6}, 51 ${90 + getSeatY(seat.index) - 12}, 57 ${90 + getSeatY(seat.index) - 12}
                   L 57 ${90 + getSeatY(seat.index) + 12}
                   C 57 ${90 + getSeatY(seat.index) + 18}, 51 ${90 + getSeatY(seat.index) + 12}, 45 ${90 + getSeatY(seat.index) + 12}
                   Z`"
              :fill="getSeatColor(seat)"
              :class="[
                'transition-all duration-200',
                seat.status === 'available' || seat.status === 'selected' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              ]"
              @click="handleSeatClick(seat)"
              @mouseenter="hoveredSeat = seat.id"
              @mouseleave="hoveredSeat = null"
            />
            <!-- 选中标记 -->
            <g v-if="isSeatSelected(seat.id)">
              <circle :cx="51" :cy="90 + getSeatY(seat.index)" r="8" fill="white"/>
              <path
                :d="`M 48 ${90 + getSeatY(seat.index)} L 50 ${92 + getSeatY(seat.index)} L 54 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
          
          <!-- 右侧座位 -->
          <g v-for="seat in getSeatsByTable('A', 'right')" :key="seat.id">
            <path
              :d="`M 113 ${90 + getSeatY(seat.index)} 
                   C 113 ${90 + getSeatY(seat.index) - 6}, 107 ${90 + getSeatY(seat.index) - 12}, 101 ${90 + getSeatY(seat.index) - 12}
                   L 101 ${90 + getSeatY(seat.index) + 12}
                   C 101 ${90 + getSeatY(seat.index) + 18}, 107 ${90 + getSeatY(seat.index) + 12}, 113 ${90 + getSeatY(seat.index) + 12}
                   Z`"
              :fill="getSeatColor(seat)"
              :class="[
                'transition-all duration-200',
                seat.status === 'available' || seat.status === 'selected' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              ]"
              @click="handleSeatClick(seat)"
              @mouseenter="hoveredSeat = seat.id"
              @mouseleave="hoveredSeat = null"
            />
            <!-- 选中标记 -->
            <g v-if="isSeatSelected(seat.id)">
              <circle :cx="107" :cy="90 + getSeatY(seat.index)" r="8" fill="white"/>
              <path
                :d="`M 104 ${90 + getSeatY(seat.index)} L 106 ${92 + getSeatY(seat.index)} L 110 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <!-- 分隔线 -->
        <line x1="140" y1="80" x2="140" y2="280" stroke="#EAEAEA" stroke-width="2"/>

        <!-- 桌子 B (中间偏右) -->
        <g id="table-b">
          <!-- 桌子中心线 -->
          <rect x="160" y="90" width="30" height="138" fill="#EAEAEA" rx="4"/>
          
          <!-- 桌子标签 -->
          <text x="175" y="175" text-anchor="middle" font-size="24" font-weight="500" fill="#CCCCCC">B</text>
          
          <!-- 左侧座位 -->
          <g v-for="seat in getSeatsByTable('B', 'left')" :key="seat.id">
            <path
              :d="`M 135 ${90 + getSeatY(seat.index)} 
                   C 135 ${90 + getSeatY(seat.index) - 6}, 141 ${90 + getSeatY(seat.index) - 12}, 147 ${90 + getSeatY(seat.index) - 12}
                   L 147 ${90 + getSeatY(seat.index) + 12}
                   C 147 ${90 + getSeatY(seat.index) + 18}, 141 ${90 + getSeatY(seat.index) + 12}, 135 ${90 + getSeatY(seat.index) + 12}
                   Z`"
              :fill="getSeatColor(seat)"
              :class="[
                'transition-all duration-200',
                seat.status === 'available' || seat.status === 'selected' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              ]"
              @click="handleSeatClick(seat)"
              @mouseenter="hoveredSeat = seat.id"
              @mouseleave="hoveredSeat = null"
            />
            <g v-if="isSeatSelected(seat.id)">
              <circle :cx="141" :cy="90 + getSeatY(seat.index)" r="8" fill="white"/>
              <path
                :d="`M 138 ${90 + getSeatY(seat.index)} L 140 ${92 + getSeatY(seat.index)} L 144 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
          
          <!-- 右侧座位 -->
          <g v-for="seat in getSeatsByTable('B', 'right')" :key="seat.id">
            <path
              :d="`M 203 ${90 + getSeatY(seat.index)} 
                   C 203 ${90 + getSeatY(seat.index) - 6}, 197 ${90 + getSeatY(seat.index) - 12}, 191 ${90 + getSeatY(seat.index) - 12}
                   L 191 ${90 + getSeatY(seat.index) + 12}
                   C 191 ${90 + getSeatY(seat.index) + 18}, 197 ${90 + getSeatY(seat.index) + 12}, 203 ${90 + getSeatY(seat.index) + 12}
                   Z`"
              :fill="getSeatColor(seat)"
              :class="[
                'transition-all duration-200',
                seat.status === 'available' || seat.status === 'selected' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              ]"
              @click="handleSeatClick(seat)"
              @mouseenter="hoveredSeat = seat.id"
              @mouseleave="hoveredSeat = null"
            />
            <g v-if="isSeatSelected(seat.id)">
              <circle :cx="197" :cy="90 + getSeatY(seat.index)" r="8" fill="white"/>
              <path
                :d="`M 194 ${90 + getSeatY(seat.index)} L 196 ${92 + getSeatY(seat.index)} L 200 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <!-- 桌子 C (右侧) -->
        <g id="table-c">
          <!-- 桌子中心线 -->
          <rect x="220" y="90" width="30" height="138" fill="#EAEAEA" rx="4"/>
          
          <!-- 桌子标签 -->
          <text x="235" y="175" text-anchor="middle" font-size="24" font-weight="500" fill="#CCCCCC">C</text>
          
          <!-- 左侧座位 -->
          <g v-for="seat in getSeatsByTable('C', 'left')" :key="seat.id">
            <path
              :d="`M 195 ${90 + getSeatY(seat.index)} 
                   C 195 ${90 + getSeatY(seat.index) - 6}, 201 ${90 + getSeatY(seat.index) - 12}, 207 ${90 + getSeatY(seat.index) - 12}
                   L 207 ${90 + getSeatY(seat.index) + 12}
                   C 207 ${90 + getSeatY(seat.index) + 18}, 201 ${90 + getSeatY(seat.index) + 12}, 195 ${90 + getSeatY(seat.index) + 12}
                   Z`"
              :fill="getSeatColor(seat)"
              :class="[
                'transition-all duration-200',
                seat.status === 'available' || seat.status === 'selected' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              ]"
              @click="handleSeatClick(seat)"
              @mouseenter="hoveredSeat = seat.id"
              @mouseleave="hoveredSeat = null"
            />
            <g v-if="isSeatSelected(seat.id)">
              <circle :cx="201" :cy="90 + getSeatY(seat.index)" r="8" fill="white"/>
              <path
                :d="`M 198 ${90 + getSeatY(seat.index)} L 200 ${92 + getSeatY(seat.index)} L 204 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
          
          <!-- 右侧座位 -->
          <g v-for="seat in getSeatsByTable('C', 'right')" :key="seat.id">
            <path
              :d="`M 263 ${90 + getSeatY(seat.index)} 
                   C 263 ${90 + getSeatY(seat.index) - 6}, 257 ${90 + getSeatY(seat.index) - 12}, 251 ${90 + getSeatY(seat.index) - 12}
                   L 251 ${90 + getSeatY(seat.index) + 12}
                   C 251 ${90 + getSeatY(seat.index) + 18}, 257 ${90 + getSeatY(seat.index) + 12}, 263 ${90 + getSeatY(seat.index) + 12}
                   Z`"
              :fill="getSeatColor(seat)"
              :class="[
                'transition-all duration-200',
                seat.status === 'available' || seat.status === 'selected' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              ]"
              @click="handleSeatClick(seat)"
              @mouseenter="hoveredSeat = seat.id"
              @mouseleave="hoveredSeat = null"
            />
            <g v-if="isSeatSelected(seat.id)">
              <circle :cx="257" :cy="90 + getSeatY(seat.index)" r="8" fill="white"/>
              <path
                :d="`M 254 ${90 + getSeatY(seat.index)} L 256 ${92 + getSeatY(seat.index)} L 260 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <!-- 会议室标签 -->
        <g id="meeting-rooms">
          <text x="70" y="310" font-size="12" font-weight="500" fill="#CCCCCC">Meeting Room A</text>
          <text x="170" y="310" font-size="12" font-weight="500" fill="#CCCCCC">Meeting Room B</text>
        </g>
      </svg>
    </div>

    <!-- 图例 -->
    <div class="flex items-center justify-center gap-6 mt-6">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded bg-gray-light"></div>
        <span class="text-sm font-medium text-gray-dark">已占用</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded bg-success"></div>
        <span class="text-sm font-medium text-gray-dark">可用</span>
      </div>
    </div>
  </div>
</template>
