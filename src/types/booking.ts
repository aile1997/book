// 座位预订系统类型定义

// 座位状态
export type SeatStatus = 'available' | 'occupied' | 'selected'

// 座位接口
export interface Seat {
  id: string // 座位ID (例如: A1, B2, C3)
  table: string // 桌子名称
  position: 'left' | 'right' // 左侧或右侧
  index: number // 座位索引
  status: SeatStatus // 座位状态
  occupiedBy?: string // 占用者姓名（如果已占用）
  backendSeatId: number // 后端座位 ID

  // 渲染信息 (从 description 解析而来)
  width?: number
  height?: number
  shape?: string
  scale?: number
  mirror?: boolean
  svgPath?: string
}

// 时间段接口
export interface TimeSlot {
  id: string
  date: string // 日期 (例如: 11.20)
  weekday: string // 星期 (例如: Wed.)
  dateISO: string // ISO格式日期 (例如: 2024-12-27)
  times: TimeOption[]
}

// 时间选项接口
export interface TimeOption {
  id: string
  time: string // 时间段 (例如: 09:00 - 12:00)
  selected: boolean
  disabled: boolean
}

// 伙伴接口
export interface Partner {
  id: number
  username: string
  fullName: string
  email: string
  openId?: string
  seat?: string
  name?: string
}

// 后端返回的 Area 结构
export interface Area {
  id: number
  name: string
  nameZh: string
  areaType: string
  capacity: number
  description: string | null
  isActive: boolean
  seats: BackendSeat[]
}

// 后端返回的 Seat 结构
export interface BackendSeat {
  seatId: number
  seatNumber: string
  table: string | null
  areaName: string
  rowNum: number | null
  columnNum: number | null
  positionX: number
  positionY: number
  isAvailable: boolean
  bookingUserInfo: {
    userId: number
    userName: string
  } | null
  description: string | null
}

export interface Partner {
  id: number
  bookingId: number
  partnerUserId: number
  inviterUserId: number
  partnerName: string // 对应后端返回的 partnerName
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null // 对应后端逻辑
  invitedAt: string
  respondedAt: string | null
}

export interface Booking {
  id: number // 后端返回的是 number
  userId: number
  seatId: number
  seatNumber: string
  areaName: string
  bookingDate: string
  timeSlotId: number
  timeSlotName: string
  startTime: string
  endTime: string
  status: string | null
  creditsUsed: number // 对应后端的 creditsUsed
  checkInTime: string | null
  checkOutTime: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  partners: Partner[] // 嵌套的伙伴数组
}
