# 代码重复与配置分散 - 详细重构方案

## 📊 问题分析概览

### 代码重复统计

| 重复类型 | 重复次数 | 涉及文件 | 代码行数 |
|---------|---------|---------|---------|
| 日期格式化 | 5次 | BookingPage, AccountPage, ConfirmModal, BookingHistoryModal | ~80行 |
| 星期计算 | 6次 | 上述4个文件 | ~40行 |
| 时段数据转换 | 2次 | ConfirmModal, BookingHistoryModal | ~60行 |
| 按日期分组 | 2次 | ConfirmModal, BookingHistoryModal | ~30行 |
| **总计** | - | - | **~210行** |

### 配置分散统计

| 配置类型 | 分散位置 | 示例 |
|---------|---------|------|
| 颜色常量 | SeatMap, 多个组件 | `#39D37F`, `#F87171`, `#60A5FA` |
| 时段配置 | BookingPage, types | `MAX_TIME_SLOT_SELECTION = 4` |
| 星期数组 | 4个组件 | `['SUN', 'MON', ...]` |
| 日期格式 | 多个组件 | `'MM.DD'`, `'YYYY-MM-DD'` |

---

## 🎯 重构方案（分4个阶段）

### 阶段一：创建核心工具函数（2-3小时，高收益/低成本）

#### 1.1 创建 `src/utils/formatters.ts`

**目的**：统一所有日期格式化逻辑

**当前重复代码**：
```typescript
// ❌ BookingPage.vue:166-170
const formatDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}.${day}`
}

// ❌ BookingPage.vue:233-241
const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}

// ❌ AccountPage.vue:259-267
const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}
```

**新文件内容**：
```typescript
// ✅ src/utils/formatters.ts

/**
 * 星期枚举
 */
export const Weekdays = {
  SHORT: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const,
  SHORT_WITH_DOT: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'] as const,
  FULL: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const,
} as const

/**
 * 日期格式枚举
 */
export const DateFormats = {
  DISPLAY: 'MM.DD',           // 01.15
  ISO: 'YYYY-MM-DD',          // 2026-01-15
  FULL: 'MM.DD WWW',          // 01.15 MON
  FULL_WITH_DOT: 'MM.DD Www.', // 01.15 Mon.
} as const

/**
 * 格式化日期为 MM.DD 格式
 * @param date - 日期对象
 * @returns 格式化后的字符串，例如 "01.15"
 */
export function formatDateShort(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

/**
 * 格式化日期为 MM.DD WWW 格式（带星期）
 * @param dateString - ISO 日期字符串，例如 "2026-01-15"
 * @param weekdayStyle - 星期样式，默认为 SHORT
 * @returns 格式化后的字符串，例如 "01.15 MON"
 */
export function formatDateFull(
  dateString: string,
  weekdayStyle: 'SHORT' | 'SHORT_WITH_DOT' | 'FULL' = 'SHORT'
): string {
  const date = new Date(dateString)
  const shortDate = formatDateShort(date)

  const weekdays =
    weekdayStyle === 'SHORT_WITH_DOT'
      ? Weekdays.SHORT_WITH_DOT
      : weekdayStyle === 'FULL'
        ? Weekdays.FULL
        : Weekdays.SHORT

  const weekday = weekdays[date.getDay()]
  return `${shortDate} ${weekday}`
}

/**
 * 获取星期几
 * @param dateString - ISO 日期字符串
 * @param style - 星期样式，默认为 SHORT
 * @returns 星期字符串，例如 "MON"
 */
export function getWeekday(
  dateString: string,
  style: 'SHORT' | 'SHORT_WITH_DOT' | 'FULL' = 'SHORT'
): string {
  const date = new Date(dateString)
  const weekdays =
    style === 'SHORT_WITH_DOT'
      ? Weekdays.SHORT_WITH_DOT
      : style === 'FULL'
        ? Weekdays.FULL
        : Weekdays.SHORT

  return weekdays[date.getDay()]
}

/**
 * 格式化时间范围
 * @param startTime - 开始时间，例如 "09:00"
 * @param endTime - 结束时间，例如 "12:00"
 * @returns 时间范围字符串，例如 "09:00 - 12:00"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`
}
```

**迁移步骤**：
1. 在 `BookingPage.vue` 中替换：
   ```typescript
   // ❌ 删除
   const formatDate = (date: Date) => { /* ... */ }
   const formatDateDisplay = (dateString: string) => { /* ... */ }
   const getWeekday = (date: Date) => { /* ... */ }

   // ✅ 添加
   import { formatDateShort, formatDateFull, getWeekday } from '../utils/formatters'

   // 替换所有调用
   formatDate(today.value) → formatDateShort(today.value)
   formatDateDisplay(dateString) → formatDateFull(dateString)
   getWeekday(date) → getWeekday(dateString, 'SHORT_WITH_DOT')
   ```

2. 在 `AccountPage.vue` 中替换：
   ```typescript
   // ❌ 删除
   const formatDateDisplay = (dateString: string) => { /* ... */ }
   const getDayOfWeek = (dateStr: string) => { /* ... */ }

   // ✅ 添加
   import { formatDateFull, getWeekday } from '../utils/formatters'

   // 替换所有调用
   formatDateDisplay(slot.bookingDate) → formatDateFull(slot.bookingDate)
   getDayOfWeek(dateStr) → getWeekday(dateStr)
   ```

3. 在 `ConfirmModal.vue` 中替换：
   ```typescript
   // ❌ 删除
   const getDayOfWeek = (dateStr: string) => { /* ... */ }

   // ✅ 添加
   import { getWeekday } from '../utils/formatters'

   // 替换所有调用
   getDayOfWeek(date) → getWeekday(date)
   ```

4. 在 `BookingHistoryModal.vue` 中替换：
   ```typescript
   // ❌ 删除内部的 formatDateDisplay 函数

   // ✅ 添加
   import { formatDateFull } from '../../utils/formatters'
   ```

---

#### 1.2 创建 `src/utils/aggregators.ts`

**目的**：统一数据聚合逻辑

**当前重复代码**：
```typescript
// ❌ ConfirmModal.vue:66-77
const groupByDate = (slots: any[]) => {
  const transformedSlots = transformTimeSlots(slots)
  const map: Record<string, TimeSlotData[]> = {}
  transformedSlots.forEach((slot) => {
    const d = slot.bookingDate
    if (!map[d]) map[d] = []
    map[d].push(slot)
  })
  return map
}

// ❌ BookingHistoryModal.vue:224-238
const groupByDate = (timeSlots: TimeSlotDetail[]) => {
  const map: Record<string, TimeSlotDetail[]> = {}
  timeSlots.forEach((slot) => {
    const displayDate = formatDateDisplay(slot.bookingDate) // 例如 "01.10 MON"
    if (!map[displayDate]) {
      map[displayDate] = []
    }
    map[displayDate].push(slot)
  })
  return map
}
```

**新文件内容**：
```typescript
// ✅ src/utils/aggregators.ts

import type { TimeSlotDetail } from '../types/booking'

/**
 * 按日期分组时段数据
 * @param timeSlots - 时段数组
 * @param keyFormat - 键格式，'iso' 使用 ISO 日期，'display' 使用显示格式
 * @returns 按日期分组的映射
 */
export function groupTimeSlotsByDate<T extends { bookingDate: string }>(
  timeSlots: T[],
  keyFormat: 'iso' | 'display' = 'display'
): Record<string, T[]> {
  const map: Record<string, T[]> = {}

  timeSlots.forEach((slot) => {
    const key = keyFormat === 'iso' ? slot.bookingDate : formatDateKey(slot.bookingDate)
    if (!map[key]) {
      map[key] = []
    }
    map[key].push(slot)
  })

  return map
}

/**
 * 格式化日期键（内部辅助函数）
 */
function formatDateKey(dateString: string): string {
  const date = new Date(dateString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekday = weekdays[date.getDay()]
  return `${month}.${day} ${weekday}`
}

/**
 * 按 groupId 分组预订
 * @param bookings - 预订数组
 * @returns 按 groupId 分组的映射
 */
export function groupBookingsById<T extends { id?: number; groupId?: number }>(
  bookings: T[]
): Map<number, T[]> {
  const groups = new Map<number, T[]>()

  bookings.forEach((booking) => {
    const key = booking.groupId || booking.id
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(booking)
  })

  return groups
}

/**
 * 获取组的最新日期（用于排序）
 */
export function getGroupLatestDate<T extends { timeSlotDetails?: TimeSlotDetail[]; bookingDate?: string }>(
  bookings: T[]
): string {
  for (const booking of bookings) {
    if (booking.timeSlotDetails && booking.timeSlotDetails.length > 0) {
      return booking.timeSlotDetails[0].bookingDate
    }
    if (booking.bookingDate) {
      return booking.bookingDate
    }
  }
  return ''
}
```

---

#### 1.3 创建 `src/utils/bookingHelpers.ts`

**目的**：统一预订相关的辅助函数

**当前重复代码**：
```typescript
// ❌ ConfirmModal.vue:43-63
const transformTimeSlots = (slots: any[]): TimeSlotData[] => {
  if (!slots || !Array.isArray(slots)) return []

  return slots.map((slot) => {
    // 如果已经是标准格式（有 bookingDate、startTime、endTime）
    if (slot.bookingDate && slot.startTime && slot.endTime) {
      return slot
    }

    // 转换 selectedTimeSlots 格式
    // time 格式为 "09:00 - 12:00"，需要解析
    const timeRange = slot.time || slot.timeRange || ''
    const [startTime, endTime] = timeRange.split(' - ').map((t: string) => t.trim())

    return {
      bookingDate: slot.dateISO || slot.date,
      startTime,
      endTime,
    }
  })
}
```

**新文件内容**：
```typescript
// ✅ src/utils/bookingHelpers.ts

/**
 * 时段数据接口
 */
export interface TimeSlotData {
  bookingDate: string
  startTime: string
  endTime: string
}

/**
 * 选中的时段数据接口（来自 selectedTimeSlots）
 */
export interface SelectedTimeSlotData {
  key: string
  dateISO: string
  date: string
  time: string  // 格式: "09:00 - 12:00"
  timeSlotId: string | number
  weekday?: string
  isExpired?: boolean
}

/**
 * 转换时间段数据格式
 * 兼容两种格式：
 * 1. selectedTimeSlots 格式：{ key, dateISO, date, time, timeSlotId, ... }
 * 2. timeSlotDetails 格式：{ bookingDate, startTime, endTime, ... }
 *
 * @param slots - 时段数组
 * @returns 标准化的时段数据
 */
export function transformTimeSlots(
  slots: Array<TimeSlotData | SelectedTimeSlotData>
): TimeSlotData[] {
  if (!slots || !Array.isArray(slots)) return []

  return slots.map((slot) => {
    // 如果已经是标准格式（有 bookingDate、startTime、endTime）
    if ('bookingDate' in slot && slot.startTime && slot.endTime) {
      return slot as TimeSlotData
    }

    // 转换 selectedTimeSlots 格式
    // time 格式为 "09:00 - 12:00"，需要解析
    const selectedSlot = slot as SelectedTimeSlotData
    const timeRange = selectedSlot.time || ''
    const [startTime, endTime] = timeRange.split(' - ').map((t: string) => t.trim())

    return {
      bookingDate: selectedSlot.dateISO || selectedSlot.date,
      startTime,
      endTime,
    }
  })
}

/**
 * 解析时间段名称
 * @param timeSlotName - 时间段名称，例如 "上午时段" 或 "09:00-12:00"
 * @returns 解析后的 { startTime, endTime } 或 null
 */
export function parseTimeSlotName(timeSlotName: string): { startTime: string; endTime: string } | null {
  // 匹配 "HH:mm-HH:mm" 格式
  const timeMatch = timeSlotName.match(/(\d{1,2}):(\d{2})[-\s](\d{1,2}):(\d{2})/)
  if (timeMatch) {
    const [, startHour, startMin, endHour, endMin] = timeMatch
    return {
      startTime: `${startHour}:${startMin}`,
      endTime: `${endHour}:${endMin}`,
    }
  }

  // 匹配中文时段名称
  if (timeSlotName.includes('上午')) {
    return { startTime: '09:00', endTime: '12:00' }
  }
  if (timeSlotName.includes('下午')) {
    return { startTime: '14:00', endTime: '17:00' }
  }

  return null
}
```

**迁移步骤**：
1. 在 `ConfirmModal.vue` 中替换：
   ```typescript
   // ❌ 删除内部的 transformTimeSlots 和 TimeSlotData 接口

   // ✅ 添加
   import { transformTimeSlots, type TimeSlotData } from '../../utils/bookingHelpers'
   ```

2. 在 `BookingHistoryModal.vue` 中添加：
   ```typescript
   // ✅ 添加
   import { parseTimeSlotName } from '../../utils/bookingHelpers'

   // 替换内部的 parseTimeSlotName 函数
   ```

---

#### 1.4 创建 `src/config/constants.ts`

**目的**：集中管理所有常量配置

**当前分散配置**：
```typescript
// ❌ 各处散落
const MAX_TIME_SLOT_SELECTION = 4  // types/booking.ts
const weekdays = ['SUN', 'MON', ...]  // 4个组件中
fill="#39D37F"  // SeatMap.vue
fill="#F87171"  // 多处
```

**新文件内容**：
```typescript
// ✅ src/config/constants.ts

/**
 * 预订相关常量
 */
export const BOOKING_CONSTANTS = {
  /** 最大时段选择数量 */
  MAX_TIME_SLOT_SELECTION: 4,
  /** 最大伙伴邀请数量 */
  MAX_PARTNERS: 6,
  /** 默认预订时长（分钟） */
  DEFAULT_DURATION_MINUTES: 180,
} as const

/**
 * 颜色主题常量
 */
export const COLOR_CONSTANTS = {
  /** 成功/可用状态 */
  SUCCESS: '#39D37F',
  /** 错误/不可用状态 */
  ERROR: '#F87171',
  /** 信息/主色调 */
  INFO: '#60A5FA',
  /** 警告 */
  WARNING: '#FBBF24',
  /** 当前用户预订 */
  MY_BOOKING: '#242424',
  /** 占用状态 */
  OCCUPIED: '#9CA3AF',
  /** 选中状态 */
  SELECTED: '#60A5FA',
  /** 可用状态 */
  AVAILABLE: '#39D37F',
} as const

/**
 * 时段配置
 */
export const TIME_SLOT_CONSTANTS = {
  /** 上午时段 */
  MORNING: {
    id: 0,
    name: '上午时段',
    startTime: '09:00',
    endTime: '12:00',
  },
  /** 下午时段 */
  AFTERNOON: {
    id: 1,
    name: '下午时段',
    startTime: '14:00',
    endTime: '17:00',
  },
} as const

/**
 * UI 相关常量
 */
export const UI_CONSTANTS = {
  /** 默认动画时长（毫秒） */
  ANIMATION_DURATION: 300,
  /** Toast 默认显示时长（毫秒） */
  TOAST_DURATION: 3000,
  /** 防抖延迟（毫秒） */
  DEBOUNCE_DELAY: 300,
  /** 节流延迟（毫秒） */
  THROTTLE_DELAY: 200,
} as const

/**
 * 缓存相关常量
 */
export const CACHE_CONSTANTS = {
  /** 短期缓存（1分钟） */
  SHORT: 60_000,
  /** 中期缓存（5分钟） */
  MEDIUM: 300_000,
  /** 长期缓存（30分钟） */
  LONG: 1_800_000,
  /** 超长期缓存（24小时） */
  VERY_LONG: 86_400_000,
} as const
```

**迁移步骤**：
1. 在 `SeatMap.vue` 中替换：
   ```typescript
   // ❌ 删除魔法字符串
   if ((seat as any).bookedByMe) return '#242424'

   // ✅ 使用常量
   import { COLOR_CONSTANTS } from '../config/constants'
   if ((seat as any).bookedByMe) return COLOR_CONSTANTS.MY_BOOKING
   ```

2. 在所有需要常量的地方添加导入：
   ```typescript
   import { BOOKING_CONSTANTS, COLOR_CONSTANTS } from '../config/constants'
   ```

---

### 阶段二：优化数据适配器（3-4小时，中收益/中成本）

#### 2.1 优化 `src/utils/dataAdapter.ts`

**当前问题**：
- 缺少运行时类型验证
- 错误处理不够完善

**优化方案**：
```typescript
// ✅ 添加运行时验证
export function convertBackendAvailabilityToFrontend(
  backendData: unknown
): SeatAvailability[] {
  // 基本类型检查
  if (!Array.isArray(backendData)) {
    console.error('[dataAdapter] Invalid availability data: not an array')
    return []
  }

  const result: SeatAvailability[] = []

  for (const item of backendData) {
    // 结构验证
    if (
      typeof item !== 'object' ||
      item === null ||
      !('seatId' in item) ||
      !('seatNumber' in item) ||
      !('isAvailable' in item)
    ) {
      console.error('[dataAdapter] Invalid seat availability item:', item)
      continue
    }

    try {
      result.push({
        backendSeatId: item.seatId as number,
        seatNumber: String(item.seatNumber),
        isAvailable: Boolean(item.isAvailable),
        bookingUserInfo: item.bookingUserInfo || null,
        groupId: item.groupId || null,
      })
    } catch (error) {
      console.error('[dataAdapter] Error converting availability item:', item, error)
    }
  }

  return result
}
```

---

### 阶段三：重构组合式函数（4-6小时，中收益/高成本）

#### 3.1 提取时段选择逻辑到 `useTimeSlotSelection.ts`

**当前问题**：
- `BookingPage.vue` 中有大量时段选择逻辑
- 状态管理分散

**新文件内容**：
```typescript
// ✅ src/composables/useTimeSlotSelection.ts

import { ref, computed } from 'vue'
import { BOOKING_CONSTANTS } from '../config/constants'

export interface TimeSlotOption {
  key: string
  dateISO: string
  date: string
  weekday: string
  time: string
  timeSlotId: number
  isExpired: boolean
  disabled?: boolean
}

export function useTimeSlotSelection() {
  const selectedTimeSlots = ref<TimeSlotOption[]>([])

  const canSelectMoreTimeSlots = computed(
    () => selectedTimeSlots.value.length < BOOKING_CONSTANTS.MAX_TIME_SLOT_SELECTION
  )

  const isTimeSlotSelected = (key: string): boolean => {
    return selectedTimeSlots.value.some((slot) => slot.key === key)
  }

  const toggleTimeSlot = (slot: TimeSlotOption) => {
    const index = selectedTimeSlots.value.findIndex((s) => s.key === slot.key)

    if (index >= 0) {
      // 已选中，移除
      selectedTimeSlots.value.splice(index, 1)
    } else {
      // 未选中，添加
      if (canSelectMoreTimeSlots.value) {
        selectedTimeSlots.value.push(slot)
      }
    }
  }

  const clearSelection = () => {
    selectedTimeSlots.value = []
  }

  return {
    selectedTimeSlots,
    canSelectMoreTimeSlots,
    isTimeSlotSelected,
    toggleTimeSlot,
    clearSelection,
  }
}
```

---

### 阶段四：API 端点集中化（1-2小时，低收益/低成本）

#### 4.1 创建 `src/config/apiEndpoints.ts`

**新文件内容**：
```typescript
// ✅ src/config/apiEndpoints.ts

/**
 * API 端点常量
 */
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
  },

  // 座位
  SEATS: {
    MAP: '/api/v1/seats/map',
    AVAILABILITY: '/api/v1/seats/availability',
    TIMESLOTS: '/api/v1/seats/timeslots',
    BATCH_AVAILABILITY: '/api/v1/seats/availability',
  },

  // 预订
  BOOKINGS: {
    LIST: '/api/v1/bookings',
    CREATE: '/api/v1/bookings',
    CANCEL: (id: number) => `/api/v1/bookings/${id}`,
    SWAP_SEAT: '/api/v1/bookings/swap-seat',
  },

  // 邀请
  INVITATIONS: {
    UPCOMING: '/api/v1/partner-invitations/upcoming',
    ACCEPT: (id: number) => `/api/v1/partner-invitations/${id}/accept`,
    DECLINE: (id: number) => `/api/v1/partner-invitations/${id}/decline`,
  },

  // 用户
  USERS: {
    CREDITS: '/api/v1/users/credits',
    TRANSACTIONS: '/api/v1/users/transactions',
    SEARCH: '/api/v1/users/search',
  },
} as const

/**
 * 类型安全的端点获取器
 */
export function getEndpoint(path: string, params?: Record<string, string | number>): string {
  let endpoint = path

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, String(value))
    })
  }

  return endpoint
}
```

---

## 📋 实施清单

### 第一阶段（立即执行，2-3小时）

- [ ] 创建 `src/utils/formatters.ts`
  - [ ] 实现日期格式化函数
  - [ ] 实现星期计算函数
  - [ ] 导出类型和常量

- [ ] 创建 `src/utils/aggregators.ts`
  - [ ] 实现 `groupTimeSlotsByDate`
  - [ ] 实现 `groupBookingsById`
  - [ ] 实现 `getGroupLatestDate`

- [ ] 创建 `src/utils/bookingHelpers.ts`
  - [ ] 实现 `transformTimeSlots`
  - [ ] 实现 `parseTimeSlotName`
  - [ ] 导出类型定义

- [ ] 创建 `src/config/constants.ts`
  - [ ] 定义所有颜色常量
  - [ ] 定义预订相关常量
  - [ ] 定义 UI 和缓存常量

- [ ] 迁移 `BookingPage.vue`
  - [ ] 删除重复的格式化函数
  - [ ] 导入并使用新工具函数
  - [ ] 测试功能完整性

- [ ] 迁移 `AccountPage.vue`
  - [ ] 删除重复的格式化函数
  - [ ] 导入并使用新工具函数
  - [ ] 测试功能完整性

- [ ] 迁移 `ConfirmModal.vue`
  - [ ] 删除重复的转换函数
  - [ ] 导入并使用新工具函数
  - [ ] 测试功能完整性

- [ ] 迁移 `BookingHistoryModal.vue`
  - [ ] 删除重复的聚合函数
  - [ ] 导入并使用新工具函数
  - [ ] 测试功能完整性

### 第二阶段（第一周，3-4小时）

- [ ] 优化 `dataAdapter.ts`
- [ ] 添加运行时类型验证
- [ ] 改进错误处理
- [ ] 添加单元测试

### 第三阶段（第二周，4-6小时）

- [ ] 创建 `useTimeSlotSelection.ts`
- [ ] 迁移时段选择逻辑
- [ ] 更新 `BookingPage.vue`
- [ ] 测试时段选择功能

### 第四阶段（有空时，1-2小时）

- [ ] 创建 `src/config/apiEndpoints.ts`
- [ ] 定义所有 API 端点
- [ ] 更新 `src/api/index.ts`
- [ ] 测试 API 调用

---

## 📊 预期收益

### 代码量减少
| 阶段 | 减少行数 | 减少比例 |
|------|---------|---------|
| 阶段一 | ~200行 | 30% |
| 阶段二 | ~50行 | 7% |
| 阶段三 | ~150行 | 20% |
| 阶段四 | ~30行 | 4% |
| **总计** | **~430行** | **~40%** |

### 维护效率提升
- **单点修改**：日期格式只需在一处修改
- **类型安全**：常量统一管理，避免魔法字符串
- **代码复用**：工具函数可在多处使用
- **测试友好**：纯函数易于单元测试

### 开发体验改善
- **IDE 支持**：完整的类型提示
- **代码导航**：快速定位工具函数
- **重构安全**：修改影响范围可控

---

## ⚠️ 注意事项

1. **渐进式迁移**：每次只迁移一个文件，确保功能正常
2. **保持向后兼容**：新旧代码可以共存一段时间
3. **充分测试**：每次迁移后进行全面测试
4. **代码审查**：团队共同审查重构代码
5. **文档更新**：及时更新项目文档

---

## 🚀 开始执行

推荐从**阶段一**开始，因为：
- ✅ 风险最低
- ✅ 收益最高
- ✅ 立即见效
- ✅ 不影响现有功能

准备好后，我可以立即开始创建这些文件并执行迁移！
