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
  return '#CCC'
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
      <!-- 内容区域 -->
      <div class="relative p-4">
        <!-- 背景SVG楼层图 -->
        <svg viewBox="0 0 218 367" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <!-- 楼层轮廓 -->
          <path d="M34.9382 0.504639H17.1485C7.9545 0.504639 0.5 7.95913 0.5 17.1532V350.731C0.5 359.925 7.9545 367.38 17.1485 367.38H201.985C211.179 367.38 218.633 359.925 218.633 350.731V66.004C218.633 56.81 211.179 49.3555 201.985 49.3555H119.215C110.021 49.3555 102.567 41.901 102.567 32.707V17.1485C102.567 7.9545 95.1123 0.5 85.9182 0.5H66.055" fill="white" stroke="#EAEAEA" stroke-miterlimit="10"/>
          <path d="M0.5 280.904H109.567" stroke="#EAEAEA" stroke-miterlimit="10"/>
          <path d="M0.5 79.8877H109.567" stroke="#EAEAEA" stroke-miterlimit="10"/>
          <path d="M133.888 280.904V367.376" stroke="#EAEAEA" stroke-miterlimit="10"/>
          <path d="M109.622 122.319V222.683" stroke="#EAEAEA" stroke-miterlimit="10"/>
          <path d="M156.084 280.904H218.633" stroke="#EAEAEA" stroke-miterlimit="10"/>

          <!-- 入口标识 -->
          <path d="M1 6.49672C1 3.46296 3.46319 0.999779 6.49694 0.999779H11.9939V11.9937H6.49694C3.46319 11.9937 1 9.53047 1 6.49672Z" fill="#CCCCCC" stroke="#CCCCCC" stroke-width="2" stroke-miterlimit="10"/>

          <!-- Fitness图标 -->
          <path d="M2.86944 1.73214L6.10729 3.60156L8.19009 2.40013C8.77457 2.0615 9.50287 2.48362 9.50287 3.16088V5.56375L11.261 6.57964C12.0913 7.05744 12.0913 8.25888 11.261 8.74131L9.50287 9.7572V12.1601C9.50287 12.8327 8.77457 13.2548 8.19009 12.9208L6.10729 11.7194L2.86944 13.5888C2.0391 14.0666 1 13.4682 1 12.508V2.81761C1 1.85739 2.0391 1.25898 2.86944 1.73677V1.73214Z" transform="translate(115, 82)" fill="#CCCCCC" stroke="#CCCCCC" stroke-width="2" stroke-miterlimit="10"/>
        </svg>

        <!-- 标签层 -->
        <div class="absolute top-2 left-2 space-y-16">
          <div class="flex items-center gap-1.5">
            <svg width="12" height="8" viewBox="0 0 17 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.22729 6.75L5.39959e-05 -1.54976e-06L16.4545 -1.11268e-07L8.22729 6.75Z" fill="#D9D9D9"/>
            </svg>
            <span class="text-[10px] font-medium text-gray-lighter tracking-tight">Entrance</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg width="15" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.6767 9.43501C14.6767 10.5898 13.7348 11.5317 12.58 11.5317H2.09667C0.941854 11.5317 0 10.5898 0 9.43501H14.6767ZM12.0559 6.29H11.5317V6.55209C11.5317 7.55947 10.7045 8.38666 9.69711 8.38666H3.93126C2.92388 8.38666 2.09668 7.55945 2.09668 6.55209V0.524162C2.09668 0.237498 2.3342 0 2.62085 0H12.0559C13.7921 0 15.2009 1.40871 15.2009 3.14501C15.2009 4.8813 13.7921 6.29 12.0559 6.29ZM12.0559 1.57249H11.5317V4.71749H12.0559C12.924 4.71749 13.6284 4.01316 13.6284 3.14499C13.6284 2.27686 12.924 1.57249 12.0559 1.57249Z" fill="#CCCCCC"/>
            </svg>
            <span class="text-[10px] font-medium text-gray-lighter tracking-tight">Bar</span>
          </div>
          <div class="mt-4 ml-24 flex items-center gap-1.5">
            <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.73555 3.27551C2.31024 3.38517 2.74554 3.88364 2.74554 4.48044V6.09069H9.09657V0H2.09754C2.02148 0.000113993 1.94621 0.0152356 1.8762 0.0444698C1.80619 0.073704 1.74285 0.116456 1.68994 0.170196C1.59374 0.268484 1.54351 0.394324 1.5486 0.524541C1.56874 1.04513 1.63157 1.96947 1.73563 3.27524L1.73555 3.27551Z" fill="#CCCCCC"/>
            </svg>
            <span class="text-[10px] font-medium text-gray-lighter tracking-tight">Lounge</span>
          </div>
          <div class="mt-12 flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.67696 1.24799C5.67696 1.57898 5.80844 1.89641 6.04249 2.13045C6.27653 2.3645 6.59396 2.49598 6.92495 2.49598C7.25594 2.49598 7.57337 2.3645 7.80741 2.13045C8.04146 1.89641 8.17294 1.57898 8.17294 1.24799C8.17294 0.917002 8.04146 0.599571 7.80741 0.365528C7.57337 0.131484 7.25594 0 6.92495 0C6.59396 0 6.27653 0.131484 6.04249 0.365528C5.80844 0.599571 5.67696 0.917002 5.67696 1.24799Z" fill="#CCCCCC"/>
            </svg>
            <span class="text-[10px] font-medium text-gray-lighter tracking-tight">Fitness</span>
          </div>
        </div>

        <!-- 会议室标签 -->
        <div class="absolute bottom-12 left-0 right-0 flex justify-around px-4">
          <div class="flex items-center gap-1.5">
            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.75391 1.64258C6.75391 2.54883 7.45156 3.2832 8.3125 3.2832C9.17344 3.2832 9.87109 2.54883 9.87109 1.64258V1.64062C9.87109 0.734375 9.17344 0 8.3125 0C7.45156 0 6.75391 0.736328 6.75391 1.64258Z" fill="#CCCCCC"/>
            </svg>
            <span class="text-[10px] font-medium text-gray-lighter tracking-tight leading-tight">Meeting<br/>Room A</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.75391 1.64258C6.75391 2.54883 7.45156 3.2832 8.3125 3.2832C9.17344 3.2832 9.87109 2.54883 9.87109 1.64258V1.64062C9.87109 0.734375 9.17344 0 8.3125 0C7.45156 0 6.75391 0.736328 6.75391 1.64258Z" fill="#CCCCCC"/>
            </svg>
            <span class="text-[10px] font-medium text-gray-lighter tracking-tight leading-tight">Meeting<br/>Room B</span>
          </div>
        </div>

        <!-- SVG 座位地图（覆盖在背景上） -->
        <svg viewBox="0 0 218 320" class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <!-- 区域 A -->
          <g id="area-a">
            <rect x="30" y="80" width="30" height="138" fill="#EAEAEA" rx="4" />
            <text x="45" y="155" text-anchor="middle" font-size="24" font-weight="500" fill="#CCCCCC">
              A
            </text>

            <!-- 左侧座位 -->
            <g v-for="seat in getSeatsByTable('A', 'left')" :key="seat.id">
              <rect
                :x="5"
                :y="80 + getSeatY(seat.index) - 8"
                width="18"
                height="18"
                rx="9"
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
                <circle :cx="14" :cy="80 + getSeatY(seat.index)" r="7" fill="white" />
                <path
                  :d="`M 11 ${80 + getSeatY(seat.index)} L 13 ${82 + getSeatY(seat.index)} L 17 ${78 + getSeatY(seat.index)}`"
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
              <rect
                :x="62"
                :y="80 + getSeatY(seat.index) - 8"
                width="18"
                height="18"
                rx="9"
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
                <circle :cx="71" :cy="80 + getSeatY(seat.index)" r="7" fill="white" />
                <path
                  :d="`M 68 ${80 + getSeatY(seat.index)} L 70 ${82 + getSeatY(seat.index)} L 74 ${78 + getSeatY(seat.index)}`"
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
          <line x1="100" y1="70" x2="100" y2="260" stroke="#EAEAEA" stroke-width="2" />

          <!-- 区域 B (上半部分) -->
          <g id="area-b">
            <rect x="120" y="80" width="30" height="68" fill="#EAEAEA" rx="4" />
            <text x="135" y="119" text-anchor="middle" font-size="24" font-weight="500" fill="#CCCCCC">
              B
            </text>

            <!-- 左侧座位 (使用不同形状) -->
            <g v-for="seat in getSeatsByTable('B', 'left').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M ${95} ${80 + getSeatY(seat.index) - 8} 
                     h 18 v 18 h -18 
                     a 9 9 0 0 1 0 -18 z`"
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
                <circle :cx="104" :cy="80 + getSeatY(seat.index)" r="7" fill="white" />
                <path
                  :d="`M 101 ${80 + getSeatY(seat.index)} L 103 ${82 + getSeatY(seat.index)} L 107 ${78 + getSeatY(seat.index)}`"
                  stroke="#A78BFA"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>

            <!-- 右侧座位 (使用不同形状) -->
            <g v-for="seat in getSeatsByTable('B', 'right').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M ${152} ${80 + getSeatY(seat.index) - 8} 
                     h 18 
                     a 9 9 0 0 1 0 18 
                     h -18 z`"
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
                <circle :cx="161" :cy="80 + getSeatY(seat.index)" r="7" fill="white" />
                <path
                  :d="`M 158 ${80 + getSeatY(seat.index)} L 160 ${82 + getSeatY(seat.index)} L 164 ${78 + getSeatY(seat.index)}`"
                  stroke="#A78BFA"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 区域 C (下半部分) -->
          <g id="area-c">
            <rect x="120" y="152" width="30" height="68" fill="#EAEAEA" rx="4" />
            <text x="135" y="191" text-anchor="middle" font-size="24" font-weight="500" fill="#CCCCCC">
              C
            </text>

            <!-- 左侧座位 (使用不同形状) -->
            <g v-for="seat in getSeatsByTable('C', 'left').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M ${95} ${152 + getSeatY(seat.index) - 8} 
                     h 18 v 18 h -18 
                     a 9 9 0 0 1 0 -18 z`"
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
                <circle :cx="104" :cy="152 + getSeatY(seat.index)" r="7" fill="white" />
                <path
                  :d="`M 101 ${152 + getSeatY(seat.index)} L 103 ${154 + getSeatY(seat.index)} L 107 ${150 + getSeatY(seat.index)}`"
                  stroke="#A78BFA"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>

            <!-- 右侧座位 (使用不同形状) -->
            <g v-for="seat in getSeatsByTable('C', 'right').slice(0, 3)" :key="seat.id">
              <path
                v-if="seat.index < 3"
                :d="`M ${152} ${152 + getSeatY(seat.index) - 8} 
                     h 18 
                     a 9 9 0 0 1 0 18 
                     h -18 z`"
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
                <circle :cx="161" :cy="152 + getSeatY(seat.index)" r="7" fill="white" />
                <path
                  :d="`M 158 ${152 + getSeatY(seat.index)} L 160 ${154 + getSeatY(seat.index)} L 164 ${150 + getSeatY(seat.index)}`"
                  stroke="#A78BFA"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </g>
          </g>

          <!-- 会议室 -->
          <g id="meeting-rooms">
            <g id="meeting-a">
              <rect x="20" y="270" width="70" height="35" fill="#EAEAEA" opacity="0.2" rx="6" />
              <svg x="28" y="278" width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="7" cy="6" r="2.5" fill="#CCCCCC" />
                <circle cx="13" cy="6" r="2.5" fill="#CCCCCC" />
              </svg>
              <text x="50" y="290" font-size="10" font-weight="500" fill="#CCCCCC">Meeting</text>
              <text x="50" y="299" font-size="10" font-weight="500" fill="#CCCCCC">Room A</text>
            </g>
            <g id="meeting-b">
              <rect x="115" y="270" width="70" height="35" fill="#EAEAEA" opacity="0.2" rx="6" />
              <svg x="123" y="278" width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="7" cy="6" r="2.5" fill="#CCCCCC" />
                <circle cx="13" cy="6" r="2.5" fill="#CCCCCC" />
              </svg>
              <text x="145" y="290" font-size="10" font-weight="500" fill="#CCCCCC">Meeting</text>
              <text x="145" y="299" font-size="10" font-weight="500" fill="#CCCCCC">Room B</text>
            </g>
          </g>
        </svg>
      </div>
    </div>

    <!-- 图例 -->
    <div class="flex items-center justify-center gap-6 mt-4">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded-md bg-gray-lighter"></div>
        <span class="text-sm font-medium text-gray-dark">Occupied</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded-md bg-success"></div>
        <span class="text-sm font-medium text-gray-dark">Available</span>
      </div>
    </div>
  </div>
</template>
