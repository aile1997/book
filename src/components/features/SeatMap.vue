<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Seat } from '../../types/booking'
import { useSeatConfig } from '../../composables/useSeatConfig'

interface Props {
  seats: Seat[]
  selectedSeat: string | null
  showTooltip?: boolean
  highlightedSeat?: string | null
  highlightedPartner?: { name: string; seat: string } | null
  scale?: number
}

interface Emits {
  (e: 'select-seat', seatId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showTooltip: false,
  highlightedSeat: null,
  highlightedPartner: null,
  scale: 1,
})

const emit = defineEmits<Emits>()

// 加载座位配置
const {
  viewport,
  colors,
  tables,
  getSeatGroupConfig,
  generateSeatPath,
  calculateCustomSeatTransform,
  calculateCheckmarkPosition,
  calculateSeatY,
} = useSeatConfig()

// 新增：计算校准后的勾选标记位置
const getAdjustedCheckmarkPath = (
  config: any,
  index: number,
  side: 'left' | 'right',
  tableId: string,
) => {
  const { cx, cy } = calculateCheckmarkPosition(config, index)
  // 计算"向内靠"的偏移量
  // 标准座位偏移 1.5，C区异形座位偏移量加大（约 3.5）以适应其形状
  const innerOffset = tableId === 'C' ? (side === 'left' ? -2 : 17) : -3
  const dx = side === 'left' ? innerOffset : -innerOffset

  const adjCx = cx + dx
  // 返回路径字符串
  return `M ${adjCx - 2} ${cy} L ${adjCx - 0.5} ${cy + 1.5} L ${adjCx + 2} ${cy - 1.5}`
}

// 新增：计算校准后人像图标位置
const getUserIconPosition = (
  config: any,
  index: number,
  side: 'left' | 'right',
  tableId: string,
) => {
  const { cx, cy } = calculateCheckmarkPosition(config, index)

  // C 区异形座位的偏移量（与勾选标记保持一致）
  // 普通区域（A/B）的偏移量
  const xOffset =
    tableId === 'C'
      ? side === 'left'
        ? -1
        : -16.5 // C 区
      : side === 'left'
        ? -2
        : 3 // A/B 区

  const adjCx = cx + xOffset

  const yOffset =
    tableId === 'C'
      ? side === 'left'
        ? -1
        : -1 // C 区
      : side === 'left'
        ? 0
        : 0 // A/B 区

  const adjCy = cy + yOffset

  // 图标尺寸为 8x8，需要减去一半以居中
  return {
    x: adjCx - 4,
    y: adjCy - 4,
  }
}

const hoveredSeat = ref<string | null>(null)

// 处理座位点击
const handleSeatClick = (seat: Seat) => {
  if (seat.status === 'available' || seat.status === 'selected') {
    emit('select-seat', seat.id)
  }
}

// 获取座位颜色
const getSeatColor = (seat: Seat): string => {
  if (seat.status === 'selected') return colors.value.selected
  if (seat.status === 'available') return colors.value.available
  // 如果是当前用户预订的座位，显示为黑色
  if ((seat as any).bookedByMe) return '#242424'
  return colors.value.occupied
}

// 根据桌子和位置获取座位列表
const getSeatsByTable = (table: 'A' | 'B' | 'C', position: 'left' | 'right') => {
  return props.seats.filter((s) => s.table === table && s.position === position)
}

// 检查座位是否被选中
const isSeatSelected = (seatId: string): boolean => {
  return props.selectedSeat === seatId
}

// 检查座位是否被高亮
const isSeatHighlighted = (seatId: string): boolean => {
  return props.highlightedSeat === seatId
}

// 计算tooltip位置
const tooltipPosition = computed(() => {
  if (!props.highlightedPartner) return null

  const seatId = props.highlightedPartner.seat
  const seat = props.seats.find((s) => s.id === seatId)
  if (!seat) return null

  const groupConfig = getSeatGroupConfig(seat.table, seat.position)
  if (!groupConfig) return null

  const checkmarkPos = calculateCheckmarkPosition(groupConfig, seat.index)
  return { x: checkmarkPos.cx, y: checkmarkPos.cy }
})

// 1. 定义本地显隐控制
const isTooltipVisible = ref(false)

// 2. 监听外部传入的伙伴数据变化
// 当父组件修改了 highlightedPartner（比如换了个人看），我们自动显示 Tooltip
watch(
  () => props.highlightedPartner,
  (newVal) => {
    if (newVal) {
      isTooltipVisible.value = true
    }
  },
  { immediate: true },
)

// 3. 内部关闭逻辑
const handleTooltipClick = () => {
  isTooltipVisible.value = false
}
</script>

<template>
  <div class="relative w-full max-w-[300px] mx-auto">
    <!-- 使用本地背景图 -->
    <div class="relative rounded-3xl overflow-hidden">
      <!-- 背景图片 - 使用Group 8作为框架 -->
      <div class="absolute inset-0">
        <img
          src="@/assets/images/booking/Group 58.png"
          alt=""
          class="w-full h-full object-contain absolute"
        />
      </div>

      <!-- 座位层 (覆盖在背景上) -->
      <div class="relative" :style="{ paddingTop: Number(viewport.aspectRatio) * scale + '%' }">
        <svg
          :viewBox="`0 0 ${viewport.width} ${viewport.height}`"
          class="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 渲染所有桌子 -->
          <g v-for="table in tables" :key="table.id">
            <!-- 左侧座位组 -->
            <g :id="`area-${table.id.toLowerCase()}-left`">
              <g
                v-for="seat in getSeatsByTable(table.id as 'A' | 'B' | 'C', 'left')"
                :key="seat.id"
              >
                <!-- 标准半圆形座位 -->
                <path
                  v-if="table.seats.left.shape !== 'custom-svg'"
                  :d="generateSeatPath(table.seats.left, seat.index)"
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

                <!-- 自定义SVG座位（C区） -->
                <g
                  v-else
                  :transform="calculateCustomSeatTransform(table.seats.left, seat.index)"
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
                    :d="table.seats.left.svgPath"
                    :fill="getSeatColor(seat)"
                    :stroke="getSeatColor(seat)"
                    stroke-width="2"
                    stroke-miterlimit="8"
                  />
                </g>

                <!-- 选中标记（勾选） -->
                <g v-if="isSeatSelected(seat.id)">
                  <path
                    :d="getAdjustedCheckmarkPath(table.seats.left, seat.index, 'left', table.id)"
                    :stroke="'#FFFFFF'"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>

                <!-- 当前用户预订标记（人像图标） -->
                <g v-if="(seat as any).bookedByMe">
                  <image
                    :x="getUserIconPosition(table.seats.left, seat.index, 'left', table.id).x"
                    :y="getUserIconPosition(table.seats.left, seat.index, 'left', table.id).y"
                    width="8"
                    height="8"
                    href="@/assets/images/booking/user-square.svg"
                  />
                </g>
              </g>
            </g>

            <!-- 右侧座位组 -->
            <g :id="`area-${table.id.toLowerCase()}-right`">
              <g
                v-for="seat in getSeatsByTable(table.id as 'A' | 'B' | 'C', 'right')"
                :key="seat.id"
              >
                <!-- 标准半圆形座位 -->
                <path
                  v-if="table.seats.right.shape !== 'custom-svg'"
                  :d="generateSeatPath(table.seats.right, seat.index)"
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

                <!-- 自定义SVG座位（C区） -->
                <g
                  v-else
                  :transform="calculateCustomSeatTransform(table.seats.right, seat.index)"
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
                    :d="table.seats.right.svgPath"
                    :fill="getSeatColor(seat)"
                    :stroke="getSeatColor(seat)"
                    stroke-width="2"
                    stroke-miterlimit="8"
                  />
                </g>

                <!-- 选中标记（勾选） -->
                <g v-if="isSeatSelected(seat.id)">
                  <path
                    :d="getAdjustedCheckmarkPath(table.seats.right, seat.index, 'right', table.id)"
                    :stroke="'#FFFFFF'"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>

                <!-- 当前用户预订标记（人像图标） -->
                <g v-if="(seat as any).bookedByMe">
                  <image
                    :x="getUserIconPosition(table.seats.right, seat.index, 'right', table.id).x"
                    :y="getUserIconPosition(table.seats.right, seat.index, 'right', table.id).y"
                    width="8"
                    height="8"
                    href="@/assets/images/booking/user-square.svg"
                  />
                </g>
              </g>
            </g>
          </g>

          <!-- Tooltip显示伙伴位置 -->
          <g
            v-if="isTooltipVisible && tooltipPosition && highlightedPartner"
            class="cursor-pointer"
            @click.stop="handleTooltipClick"
          >
            <!-- Tooltip背景 -->
            <rect
              :x="tooltipPosition.x - 40"
              :y="tooltipPosition.y - 35"
              width="80"
              height="25"
              rx="4"
              fill="#333333"
              opacity="0.9"
            />

            <!-- Tooltip箭头 -->
            <path
              :d="`M ${tooltipPosition.x - 5} ${tooltipPosition.y - 8} L ${tooltipPosition.x} ${tooltipPosition.y - 5} L ${tooltipPosition.x + 5} ${tooltipPosition.y - 8}`"
              fill="#333333"
              opacity="0.9"
            />

            <!-- Tooltip文字 -->
            <text
              :x="tooltipPosition.x"
              :y="tooltipPosition.y - 20"
              fill="white"
              font-size="8"
              font-weight="500"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ `${highlightedPartner.name}-${highlightedPartner.seat}` }}
            </text>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* SVG元素的过渡效果 */
path,
g {
  transition: opacity 0.2s ease-in-out;
}
</style>
