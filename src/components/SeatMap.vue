<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Seat } from '../types/booking'

interface Props {
  seats: Seat[]
  selectedSeat: string | null
  showTooltip?: boolean
  highlightedSeat?: string | null
  highlightedPartner?: { name: string; seat: string } | null
}

interface Emits {
  (e: 'select-seat', seatId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showTooltip: false,
  highlightedSeat: null,
  highlightedPartner: null
})
const emit = defineEmits<Emits>()

const hoveredSeat = ref<string | null>(null)

const handleSeatClick = (seat: Seat) => {
  if (seat.status === 'available' || seat.status === 'selected') {
    emit('select-seat', seat.id)
  }
}

const getSeatColor = (seat: Seat): string => {
  if (seat.status === 'selected') return '#A78BFA'
  if (seat.status === 'available') return '#38D87B'
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

const isSeatHighlighted = (seatId: string): boolean => {
  return props.highlightedSeat === seatId
}

// C区座位的特殊SVG path（来自Vector.svg）
const cSeatPath = "M12.7307 1.73203L8.51711 4.1648L5.80667 2.60131C5.04605 2.16064 4.09831 2.70996 4.09831 3.59131V6.71828L1.81042 8.0403C0.729861 8.66208 0.729861 10.2256 1.81042 10.8534L4.09831 12.1754V15.3024C4.09831 16.1777 5.04605 16.727 5.80667 16.2924L8.51711 14.7289L12.7307 17.1616C13.8112 17.7834 15.1634 17.0047 15.1634 15.7551V3.1446C15.1634 1.89502 13.8112 1.11628 12.7307 1.73806V1.73203Z"

// 计算tooltip位置
const tooltipPosition = computed(() => {
  if (!props.highlightedPartner) return null
  const seatId = props.highlightedPartner.seat
  const seat = props.seats.find(s => s.id === seatId)
  if (!seat) return null
  
  let x = 0, y = 0
  
  if (seat.table === 'A') {
    x = seat.position === 'left' ? 40 : 90
    y = 88 + seat.index * 24
  } else if (seat.table === 'B') {
    x = seat.position === 'left' ? 120 : 175
    y = 88 + seat.index * 24
  } else if (seat.table === 'C') {
    x = seat.position === 'left' ? 120 : 175
    y = 160 + seat.index * 24
  }
  
  return { x, y }
})
</script>

<template>
  <div class="relative w-full max-w-[280px] mx-auto">
    <!-- 使用本地背景图 -->
    <div class="relative bg-white rounded-3xl overflow-hidden">
      <!-- 背景图片 - 使用Group 8作为框架 -->
      <div class="absolute inset-0">
        <img
          src="/seat-map-frame.png"
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

          <!-- 区域 C - 左侧座位 (使用特殊SVG形状) -->
          <g id="area-c-left">
            <g v-for="seat in getSeatsByTable('C', 'left').slice(0, 3)" :key="seat.id">
              <g 
                v-if="seat.index < 3"
                :transform="`translate(${89}, ${155 + getSeatY(seat.index)}) scale(0.8)`"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              >
                <path
                  :d="cSeatPath"
                  :fill="getSeatColor(seat)"
                  :stroke="getSeatColor(seat)"
                  stroke-width="2"
                  stroke-miterlimit="10"
                />
              </g>
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="97" :cy="163 + getSeatY(seat.index)" r="5" fill="white" />
                <path
                  :d="`M 95 ${163 + getSeatY(seat.index)} L 96.5 ${164.5 + getSeatY(seat.index)} L 99 ${161.5 + getSeatY(seat.index)}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 C - 右侧座位 (使用特殊SVG形状，镜像) -->
          <g id="area-c-right">
            <g v-for="seat in getSeatsByTable('C', 'right').slice(0, 3)" :key="seat.id">
              <g 
                v-if="seat.index < 3"
                :transform="`translate(${167}, ${155 + getSeatY(seat.index)}) scale(-0.8, 0.8)`"
                :class="[
                  'transition-all duration-200',
                  seat.status === 'available' || seat.status === 'selected'
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-not-allowed',
                ]"
                @click="handleSeatClick(seat)"
                @mouseenter="hoveredSeat = seat.id"
                @mouseleave="hoveredSeat = null"
              >
                <path
                  :d="cSeatPath"
                  :fill="getSeatColor(seat)"
                  :stroke="getSeatColor(seat)"
                  stroke-width="2"
                  stroke-miterlimit="10"
                />
              </g>
              <g v-if="isSeatSelected(seat.id)">
                <circle :cx="159" :cy="163 + getSeatY(seat.index)" r="5" fill="white" />
                <path
                  :d="`M 157 ${163 + getSeatY(seat.index)} L 158.5 ${164.5 + getSeatY(seat.index)} L 161 ${161.5 + getSeatY(seat.index)}`"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 伙伴位置Tooltip -->
          <g v-if="highlightedPartner && tooltipPosition">
            <!-- Tooltip背景 -->
            <rect
              :x="tooltipPosition.x - 35"
              :y="tooltipPosition.y - 40"
              width="70"
              height="35"
              rx="6"
              fill="#333333"
            />
            <!-- Tooltip箭头 -->
            <polygon
              :points="`${tooltipPosition.x - 5},${tooltipPosition.y - 5} ${tooltipPosition.x + 5},${tooltipPosition.y - 5} ${tooltipPosition.x},${tooltipPosition.y + 2}`"
              fill="#333333"
            />
            <!-- 关闭按钮 -->
            <circle
              :cx="tooltipPosition.x + 30"
              :cy="tooltipPosition.y - 35"
              r="6"
              fill="#555555"
              class="cursor-pointer"
            />
            <path
              :d="`M ${tooltipPosition.x + 28} ${tooltipPosition.y - 37} L ${tooltipPosition.x + 32} ${tooltipPosition.y - 33} M ${tooltipPosition.x + 32} ${tooltipPosition.y - 37} L ${tooltipPosition.x + 28} ${tooltipPosition.y - 33}`"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <!-- 伙伴名字 -->
            <text
              :x="tooltipPosition.x"
              :y="tooltipPosition.y - 27"
              text-anchor="middle"
              fill="white"
              font-size="8"
              font-weight="500"
            >
              {{ highlightedPartner.name }}
            </text>
            <!-- 座位号 -->
            <text
              :x="tooltipPosition.x"
              :y="tooltipPosition.y - 15"
              text-anchor="middle"
              fill="white"
              font-size="12"
              font-weight="600"
            >
              {{ highlightedPartner.seat }}
            </text>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>
