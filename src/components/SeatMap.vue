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
</script>

<template>
  <div class="relative w-full max-w-[340px] mx-auto">
    <div class="relative bg-white rounded-3xl p-6 shadow-lg">
      <!-- Labels -->
      <div class="absolute top-8 left-8 text-gray text-xs font-medium">
        <div class="flex items-center gap-2 mb-6">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 14L8 2M8 2L4 6M8 2L12 6"
              stroke="#CCCCCC"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-gray-lighter">Entrance</span>
        </div>
      </div>

      <div class="absolute top-12 right-8 text-gray text-xs font-medium space-y-8">
        <div class="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="6" fill="#CCCCCC" opacity="0.3" rx="2" />
          </svg>
          <span class="text-gray-lighter">Bar</span>
        </div>
        <div class="flex items-center gap-2">
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <rect x="2" y="2" width="16" height="12" fill="#CCCCCC" opacity="0.3" rx="2" />
          </svg>
          <span class="text-gray-lighter">Lounge</span>
        </div>
      </div>

      <div class="absolute bottom-32 left-8 flex items-center gap-2 text-gray text-xs font-medium">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" fill="#CCCCCC" opacity="0.3" rx="2" />
        </svg>
        <span class="text-gray-lighter">Fitness</span>
      </div>

      <!-- SVG Seat Map -->
      <svg viewBox="0 0 280 350" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <!-- Table A -->
        <g id="table-a">
          <rect x="70" y="90" width="30" height="138" fill="#EAEAEA" rx="4" />
          <text x="85" y="165" text-anchor="middle" font-size="28" font-weight="500" fill="#CCCCCC">
            A
          </text>

          <!-- Left seats -->
          <g v-for="seat in getSeatsByTable('A', 'left')" :key="seat.id">
            <rect
              :x="38"
              :y="90 + getSeatY(seat.index) - 10"
              width="20"
              height="20"
              rx="10"
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
              <circle :cx="48" :cy="90 + getSeatY(seat.index)" r="8" fill="white" />
              <path
                :d="`M 45 ${90 + getSeatY(seat.index)} L 47 ${92 + getSeatY(seat.index)} L 51 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>

          <!-- Right seats -->
          <g v-for="seat in getSeatsByTable('A', 'right')" :key="seat.id">
            <rect
              :x="102"
              :y="90 + getSeatY(seat.index) - 10"
              width="20"
              height="20"
              rx="10"
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
              <circle :cx="112" :cy="90 + getSeatY(seat.index)" r="8" fill="white" />
              <path
                :d="`M 109 ${90 + getSeatY(seat.index)} L 111 ${92 + getSeatY(seat.index)} L 115 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <!-- Divider -->
        <line x1="140" y1="80" x2="140" y2="280" stroke="#EAEAEA" stroke-width="2" />

        <!-- Table B -->
        <g id="table-b">
          <rect x="160" y="90" width="30" height="138" fill="#EAEAEA" rx="4" />
          <text
            x="175"
            y="165"
            text-anchor="middle"
            font-size="28"
            font-weight="500"
            fill="#CCCCCC"
          >
            B
          </text>

          <!-- Left seats -->
          <g v-for="seat in getSeatsByTable('B', 'left')" :key="seat.id">
            <rect
              :x="128"
              :y="90 + getSeatY(seat.index) - 10"
              width="20"
              height="20"
              rx="10"
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
              <circle :cx="138" :cy="90 + getSeatY(seat.index)" r="8" fill="white" />
              <path
                :d="`M 135 ${90 + getSeatY(seat.index)} L 137 ${92 + getSeatY(seat.index)} L 141 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>

          <!-- Right seats -->
          <g v-for="seat in getSeatsByTable('B', 'right')" :key="seat.id">
            <rect
              :x="192"
              :y="90 + getSeatY(seat.index) - 10"
              width="20"
              height="20"
              rx="10"
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
              <circle :cx="202" :cy="90 + getSeatY(seat.index)" r="8" fill="white" />
              <path
                :d="`M 199 ${90 + getSeatY(seat.index)} L 201 ${92 + getSeatY(seat.index)} L 205 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <!-- Table C -->
        <g id="table-c">
          <rect x="220" y="90" width="30" height="138" fill="#EAEAEA" rx="4" />
          <text
            x="235"
            y="165"
            text-anchor="middle"
            font-size="28"
            font-weight="500"
            fill="#CCCCCC"
          >
            C
          </text>

          <!-- Left seats (special shapes for table C) -->
          <g v-for="seat in getSeatsByTable('C', 'left')" :key="seat.id">
            <path
              v-if="seat.index < 2"
              :d="`M ${198} ${90 + getSeatY(seat.index) - 10} 
                   h 20 v 20 h -20 
                   a 10 10 0 0 1 0 -20 z`"
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
            <rect
              v-else
              :x="198"
              :y="90 + getSeatY(seat.index) - 10"
              width="20"
              height="20"
              rx="10"
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
              <circle :cx="208" :cy="90 + getSeatY(seat.index)" r="8" fill="white" />
              <path
                :d="`M 205 ${90 + getSeatY(seat.index)} L 207 ${92 + getSeatY(seat.index)} L 211 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>

          <!-- Right seats (special shapes for table C) -->
          <g v-for="seat in getSeatsByTable('C', 'right')" :key="seat.id">
            <path
              v-if="seat.index < 3"
              :d="`M ${252} ${90 + getSeatY(seat.index) - 10} 
                   h 20 
                   a 10 10 0 0 1 0 20 
                   h -20 z`"
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
            <rect
              v-else
              :x="252"
              :y="90 + getSeatY(seat.index) - 10"
              width="20"
              height="20"
              rx="10"
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
              <circle :cx="262" :cy="90 + getSeatY(seat.index)" r="8" fill="white" />
              <path
                :d="`M 259 ${90 + getSeatY(seat.index)} L 261 ${92 + getSeatY(seat.index)} L 265 ${88 + getSeatY(seat.index)}`"
                stroke="#A78BFA"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <!-- Meeting Rooms -->
        <g id="meeting-rooms">
          <g id="meeting-a">
            <rect x="45" y="285" width="80" height="40" fill="#EAEAEA" opacity="0.2" rx="6" />
            <svg x="55" y="295" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="7" cy="6" r="2.5" fill="#CCCCCC" />
              <circle cx="13" cy="6" r="2.5" fill="#CCCCCC" />
              <path
                d="M4 14c0-1.5 1.5-3 3-3s3 1.5 3 3M10 14c0-1.5 1.5-3 3-3s3 1.5 3 3"
                stroke="#CCCCCC"
                stroke-width="1.5"
                fill="none"
              />
            </svg>
            <text x="80" y="307" font-size="11" font-weight="500" fill="#CCCCCC">Meeting</text>
            <text x="80" y="318" font-size="11" font-weight="500" fill="#CCCCCC">Room A</text>
          </g>
          <g id="meeting-b">
            <rect x="155" y="285" width="80" height="40" fill="#EAEAEA" opacity="0.2" rx="6" />
            <svg x="165" y="295" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="7" cy="6" r="2.5" fill="#CCCCCC" />
              <circle cx="13" cy="6" r="2.5" fill="#CCCCCC" />
              <path
                d="M4 14c0-1.5 1.5-3 3-3s3 1.5 3 3M10 14c0-1.5 1.5-3 3-3s3 1.5 3 3"
                stroke="#CCCCCC"
                stroke-width="1.5"
                fill="none"
              />
            </svg>
            <text x="190" y="307" font-size="11" font-weight="500" fill="#CCCCCC">Meeting</text>
            <text x="190" y="318" font-size="11" font-weight="500" fill="#CCCCCC">Room B</text>
          </g>
        </g>
      </svg>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-6 mt-6">
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
