// 座位预订系统类型定义

// 多时段选择最大数量
export const MAX_TIME_SLOT_SELECTION = 4

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
  // 新增：唯一标识符，用于多时段选择
  key?: string  // 格式："{dateISO}_{id}"
  // 新增：是否已过期
  isExpiredToday?: boolean
  // 新增：原始结束时间
  rawEndTime?: string
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
  // 新增：多时段支持
  timeSlots?: number[]  // 该伙伴参与的时间段ID列表
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

  // 新增：多时段支持
  timeSlotDetails?: TimeSlotDetail[]
  // 新增：组相关字段
  groupId?: number
  groupName?: string
  groupColor?: string
  // 新增：用于前端判断的预订ID（兼容旧数据）
  bookingId?: number
}

// 时段详情接口
export interface TimeSlotDetail {
  id: number
  bookingDate: string
  timeSlotId: number
  timeSlotName: string
  startTime: string
  endTime: string
  creditsRequired: number
  slotStatus: string
  bookingId: number
  seatId: number
  areaId: number
}

// 选中的时段信息
export interface SelectedTimeSlot {
  key: string
  dateISO: string
  date: string
  weekday: string
  timeSlotId: string
  time: string
  isExpired: boolean
}

// 组（Group）接口
export interface BookingGroup {
  id: number
  name: string
  color: string
  memberIds: number[]
  bookingIds: number[]
  createdAt: string
}

// API 请求类型：创建预订
export interface CreateBookingRequest {
  areaId: number
  seatId: number
  timeSlots: Array<{
    bookingDate: string
    timeSlotId: number
  }>
  invitePartners?: Array<{
    userId: string
    openId: string
    username: string
    seatId: number
  }>
}

// API 请求类型：换座
export interface SwapSeatRequest {
  bookingId: number
  newSeatId: number
  invitePartners?: Array<{
    userId: string
    openId: string
    username: string
    seatId: number
  }>
}

// API 响应类型：批量座位可用性查询
export interface BatchSeatAvailabilityResponse {
  bookingDate: string
  timeSlotId: number
  areaId: number
  seats: Array<{
    seatId: number
    seatNumber: string
    table: string
    areaName: string
    rowNum: number
    columnNum: number
    positionX: number
    positionY: number
    isAvailable: boolean
    bookingUserInfo: {
      userId: number
      userName: string
      bookingId?: number
    } | null
    groupId: number | null
  }>
}
