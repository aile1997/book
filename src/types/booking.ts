// 座位预订系统类型定义

// 多时段选择最大数量
export const MAX_TIME_SLOT_SELECTION = 4

// 座位状态
export type SeatStatus = 'available' | 'occupied' | 'selected'

// 后端返回的时间段结构
export interface TimeSlotBackend {
  id: number
  startTime: string
  endTime: string
}

// 座位可用性信息
export interface SeatAvailability {
  seatId: number
  seatNumber: string
  isAvailable: boolean
  bookingUserInfo: BookingUserInfo | null
  groupId: number | null
  bookingId?: number
}

// 座位预订用户信息
export interface BookingUserInfo {
  userId: number
  userName: string
  bookingId?: number
}

// 座位接口
export interface Seat {
  id: string // 座位ID (例如: A1, B2, C3)
  table: string // 桌子名称
  position: 'left' | 'right' // 左侧或右侧
  index: number // 座位索引
  status: SeatStatus // 座位状态
  occupiedBy?: string // 占用者姓名（如果已占用）
  backendSeatId: number // 后端座位 ID

  // 预订相关动态属性
  bookedByMe?: boolean // 是否为当前用户预订
  bookingId?: number | null // 预订 ID

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

// 用户基本信息（用于伙伴搜索和邀请）
export interface User {
  id: number
  username: string
  fullName: string
  email: string
  openId?: string
}

// 伙伴邀请信息（后端返回的邀请状态）
export interface PartnerInvitation {
  id: number
  bookingId: number
  partnerUserId: number
  inviterUserId: number
  partnerName: string
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null
  invitedAt: string
  respondedAt: string | null
  seat?: string
  timeSlots?: number[]
}

// 前端使用的组合类型（User + 邀请状态）
export interface Partner extends User {
  invitationStatus?: PartnerInvitation['invitationStatus']
  seat?: string
  name?: string // 兼容旧字段
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

export interface Booking {
  id: number // 主键：后端返回的真实预订 ID
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
  // 兼容性字段：旧数据可能使用 bookingId 而非 id
  bookingId?: number
}

/**
 * 类型守卫：检查是否为有效预订
 */
export function isValidBooking(booking: unknown): booking is Booking {
  return (
    booking !== null &&
    typeof booking === 'object' &&
    'id' in booking &&
    typeof booking.id === 'number' &&
    'seatId' in booking &&
    typeof booking.seatId === 'number' &&
    'bookingDate' in booking &&
    typeof booking.bookingDate === 'string'
  )
}

/**
 * 工具函数：获取预订 ID（兼容旧数据）
 * 优先使用 id（主键），回退到 bookingId（兼容旧数据）
 */
export function getBookingId(booking: Partial<Booking>): number | null {
  return booking.id ?? booking.bookingId ?? null
}

// 时段详情接口
export interface TimeSlotDetail {
  id: number
  bookingDate: string
  timeSlotId: number
  timeSlotName: string | null
  startTime: string
  endTime: string
  creditsRequired: number
  slotStatus: string | null
  bookingId: number
  seatId: number
  areaId: number
  seatNumber: string  // 新增：座位号（格式如 "A-01"）
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

// ========== API 响应类型定义 ==========

// 创建预订响应
export interface CreateBookingResponse {
  bookingId: number
  groupId: number
  timeSlots: TimeSlotDetail[]
}

// 获取用户预订响应
export interface GetUserBookingsResponse {
  bookings: Booking[]
  total: number
}

// 批量座位可用性查询响应
export interface BatchSeatAvailabilityQuery {
  areaId: number
  bookingDate: string
  timeSlotId: number
}

export interface BatchSeatAvailabilityResponse {
  data: BatchAvailabilityItem[]
}

export interface BatchAvailabilityItem {
  bookingDate: string
  timeSlotId: number
  areaId: number
  seats: SeatAvailability[]
}

// 换座响应
export interface SwapSeatResponse {
  bookingId: number
  newSeatId: number
  message?: string
}

// 取消预订响应
export interface CancelBookingResponse {
  message: string
  success: boolean
}

// 用户积分响应
export interface UserCreditsResponse {
  credits: number
}

// 用户交易记录响应
export interface UserTransactionsResponse {
  transactions: Array<{
    id: number
    amount: number
    type: string
    createdAt: string
  }>
  total: number
}
