// src/config/constants.ts

/**
 * 预订相关常量
 */
export const BOOKING_CONSTANTS = {
  /** 最大时段选择数量 */
  MAX_TIME_SLOT_SELECTION: 4,
  /** 最大伙伴邀请数量 */
  MAX_PARTNERS: 3,
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
