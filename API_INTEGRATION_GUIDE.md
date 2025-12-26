# Book 项目 API 集成指南

本文档详细说明了项目中所有已实现的 API 接口、数据结构和使用方法。

## 目录

1. [认证接口](#认证接口)
2. [用户接口](#用户接口)
3. [座位接口](#座位接口)
4. [预订接口](#预订接口)
5. [伙伴邀请接口](#伙伴邀请接口)
6. [管理员接口](#管理员接口)
7. [数据适配器](#数据适配器)
8. [组合式函数](#组合式函数)

---

## 认证接口

### 用户登录
**端点：** `POST /api/v1/auth/login`

**请求体：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": {
    "token": "string",
    "userInfo": {
      "id": 0,
      "username": "string",
      "email": "string",
      "fullName": "string",
      "credits": 0,
      "status": "ACTIVE",
      "createdAt": "2025-12-23T13:18:03.154Z",
      "updatedAt": "2025-12-23T13:18:03.154Z"
    }
  }
}
```

**前端调用：**
```typescript
import { login } from '@/api'

const response = await login({ username: 'user', password: 'pass' })
// Token 自动存储到 localStorage
```

### 用户注册
**端点：** `POST /api/v1/auth/register`

### 用户登出
**端点：** `POST /api/v1/auth/logout`

### 飞书登录
**端点：** `GET /api/v1/auth/feishu/login`

**飞书登录回调：** `POST /api/v1/auth/feishu/callback`

---

## 用户接口

### 获取当前登录用户信息
**端点：** `GET /api/v1/users/me`

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": {
    "id": 0,
    "username": "string",
    "email": "string",
    "fullName": "string",
    "credits": 0,
    "status": "ACTIVE",
    "createdAt": "2025-12-23T13:18:03.154Z",
    "updatedAt": "2025-12-23T13:18:03.154Z"
  }
}
```

### 获取当前用户积分余额
**端点：** `GET /api/v1/users/me/credits`

### 获取当前用户的积分交易记录
**端点：** `GET /api/v1/users/me/transactions`

### 搜索用户
**端点：** `GET /api/v1/users/search`

**查询参数：**
- `query` (string)：搜索关键词

---

## 座位接口

### 获取座位平面图数据
**端点：** `GET /api/v1/seats/map`

**响应结构：**
```json
{
  "code": 0,
  "message": "string",
  "data": {
    "areas": [
      {
        "id": 1,
        "name": "A",
        "nameZh": "A 区",
        "areaType": "LOUNGE",
        "capacity": 12,
        "description": null,
        "isActive": true,
        "seats": [
          {
            "seatId": 1,
            "seatNumber": "A-01",
            "table": "A",
            "areaName": "A",
            "rowNum": 1,
            "columnNum": 1,
            "positionX": 100,
            "positionY": 100,
            "isAvailable": true,
            "bookingUserInfo": null,
            "description": "{\"width\": 10, \"height\": 12, \"shape\": \"semicircle-left\"}"
          }
        ]
      }
    ]
  }
}
```

**前端使用：**
```typescript
import { useSeats } from '@/composables/useSeats'

const { seats, loadSeatMap } = useSeats()
// 自动加载座位数据
```

### 查询座位可用性
**端点：** `GET /api/v1/seats/availability`

**查询参数：**
- `bookingDate` (string)：预订日期，格式 `YYYY-MM-DD`
- `timeSlotId` (number)：时间段 ID（0 = 上午，1 = 下午）
- `areaId` (number)：区域 ID

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "seatId": 1,
      "seatNumber": "A-01",
      "isAvailable": true,
      "bookingUserInfo": null
    }
  ]
}
```

**前端使用：**
```typescript
const { querySeatAvailability } = useSeats()

// 查询 2025-12-23 上午 (timeSlotId=0) A 区 (areaId=1) 的座位可用性
await querySeatAvailability('2025-12-23', 0, 1)
```

### 获取可预订时间段列表
**端点：** `GET /api/v1/seats/timeslots`

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "id": 0,
      "time": "09:00 - 12:00"
    },
    {
      "id": 1,
      "time": "12:00 - 18:00"
    }
  ]
}
```

---

## 预订接口

### 创建预订
**端点：** `POST /api/v1/bookings`

**请求体：**
```json
{
  "seatId": 1,
  "bookingDate": "2025-12-23",
  "timeSlotId": 0,
  "partnerSeatMap": {
    "100": 2,
    "101": 3
  }
}
```

**说明：**
- `seatId`：座位 ID（后端座位 ID）
- `bookingDate`：预订日期，格式 `YYYY-MM-DD`
- `timeSlotId`：时间段 ID（0 = 上午，1 = 下午）
- `partnerSeatMap`：伙伴座位映射，key 是用户 ID，value 是座位 ID

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": {
    "id": 1,
    "userId": 1,
    "seatId": 1,
    "seatNumber": "A-01",
    "areaName": "A",
    "bookingDate": "2025-12-23",
    "timeSlotId": 0,
    "timeSlotName": "09:00 - 12:00",
    "startTime": {
      "hour": 9,
      "minute": 0,
      "second": 0,
      "nano": 0
    },
    "endTime": {
      "hour": 12,
      "minute": 0,
      "second": 0,
      "nano": 0
    },
    "status": "PENDING",
    "creditsUsed": 10,
    "checkInTime": null,
    "checkOutTime": null,
    "cancellationReason": null,
    "createdAt": "2025-12-23T13:18:03.161Z",
    "updatedAt": "2025-12-23T13:18:03.161Z",
    "partners": [
      {
        "id": 1,
        "bookingId": 1,
        "partnerUserId": 100,
        "partnerName": "Partner Name",
        "invitationStatus": "PENDING",
        "invitedAt": "2025-12-23T13:18:03.161Z",
        "respondedAt": null
      }
    ]
  }
}
```

**前端使用：**
```typescript
import { useBooking } from '@/composables/useBooking'

const { makeBooking } = useBooking()

const bookingData = {
  seatId: 1,
  bookingDate: '2025-12-23',
  timeSlotId: 0,
  partnerSeatMap: { 100: 2, 101: 3 }
}

const result = await makeBooking(bookingData)
```

### 获取用户预订列表
**端点：** `GET /api/v1/bookings`

### 获取预订详情
**端点：** `GET /api/v1/bookings/{bookingId}`

### 取消预订
**端点：** `DELETE /api/v1/bookings/{bookingId}`

### 更换座位
**端点：** `PUT /api/v1/bookings/{bookingId}/swap-seat`

### 添加预订伙伴
**端点：** `POST /api/v1/bookings/{bookingId}/partners`

### 移除预订伙伴
**端点：** `DELETE /api/v1/bookings/{bookingId}/partners/{partnerUserId}`

---

## 伙伴邀请接口

### 获取未来邀请列表
**端点：** `GET /api/v1/partner-invitations/upcoming`

**查询参数：**
- `skip` (number)：跳过的记录数，默认 0
- `limit` (number)：每页返回的记录数，默认 20

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "id": 1,
      "bookingId": 1,
      "inviterUserId": 1,
      "inviterName": "Inviter Name",
      "seatNumber": "A-01",
      "areaName": "A",
      "bookingDate": "2025-12-23",
      "timeRange": "09:00 - 12:00",
      "invitationStatus": "PENDING",
      "invitedAt": "2025-12-23T13:18:03.147Z",
      "respondedAt": null
    }
  ]
}
```

**前端使用：**
```typescript
import { useInvitation } from '@/composables/useInvitation'

const { upcomingInvitations, accept, decline } = useInvitation()

// 接受邀请
await accept(invitationId)

// 拒绝邀请
await decline(invitationId)

// 自动轮询每 30 秒更新一次邀请列表
```

### 接受邀请
**端点：** `POST /api/v1/partner-invitations/{invitationId}/accept`

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": {
    "id": 1,
    "bookingId": 1,
    "inviterUserId": 1,
    "inviterName": "Inviter Name",
    "seatNumber": "A-01",
    "areaName": "A",
    "bookingDate": "2025-12-23",
    "timeRange": "09:00 - 12:00",
    "invitationStatus": "ACCEPTED",
    "invitedAt": "2025-12-23T13:18:03.143Z",
    "respondedAt": "2025-12-23T13:18:03.143Z"
  }
}
```

### 拒绝邀请
**端点：** `POST /api/v1/partner-invitations/{invitationId}/decline`

---

## 管理员接口

### 创建新区域
**端点：** `POST /api/v1/admin/areas`

**请求体：**
```json
{
  "name": "A",
  "nameZh": "A 区",
  "areaType": "LOUNGE",
  "capacity": 12,
  "description": null
}
```

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": {
    "id": 1,
    "name": "A",
    "nameZh": "A 区",
    "areaType": "LOUNGE",
    "capacity": 12,
    "description": null,
    "isActive": true,
    "createdAt": "2025-12-23T13:18:03.154Z",
    "updatedAt": "2025-12-23T13:18:03.154Z"
  }
}
```

**前端使用：**
```typescript
import { createArea } from '@/api'

const areaData = {
  name: 'A',
  nameZh: 'A 区',
  areaType: 'LOUNGE',
  capacity: 12,
  description: null
}

const response = await createArea(areaData)
const areaId = response.id
```

### 批量创建座位
**端点：** `POST /api/v1/admin/seats/batch`

**请求体：**
```json
{
  "seats": [
    {
      "seatNumber": "A-01",
      "table": "A",
      "areaId": 1,
      "rowNum": 1,
      "columnNum": 1,
      "positionX": 100,
      "positionY": 100,
      "description": "{\"width\": 10, \"height\": 12, \"shape\": \"semicircle-left\"}"
    }
  ]
}
```

**响应：**
```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "id": 1,
      "seatNumber": "A-01",
      "table": "A",
      "areaName": "A",
      "rowNum": 1,
      "columnNum": 1,
      "positionX": 100,
      "positionY": 100,
      "status": "AVAILABLE",
      "description": "{\"width\": 10, \"height\": 12, \"shape\": \"semicircle-left\"}",
      "createdAt": "2025-12-23T13:18:03.169Z",
      "updatedAt": "2025-12-23T13:18:03.169Z"
    }
  ]
}
```

**前端使用：**
```typescript
import { batchCreateSeats } from '@/api'

const seatsData = {
  seats: [
    {
      seatNumber: 'A-01',
      table: 'A',
      areaId: 1,
      rowNum: 1,
      columnNum: 1,
      positionX: 100,
      positionY: 100,
      description: '{"width": 10, "height": 12, "shape": "semicircle-left"}'
    }
  ]
}

const response = await batchCreateSeats(seatsData)
```

### 创建新座位
**端点：** `POST /api/v1/admin/seats`

### 更新座位信息
**端点：** `PUT /api/v1/admin/seats/{seatId}`

### 删除座位
**端点：** `DELETE /api/v1/admin/seats/{seatId}`

### 更新区域信息
**端点：** `PUT /api/v1/admin/areas/{areaId}`

### 删除区域
**端点：** `DELETE /api/v1/admin/areas/{areaId}`

---

## 数据适配器

数据适配器位于 `src/utils/dataAdapter.ts`，用于在前端配置和后端 API 数据之间进行转换。

### 转换前端配置到后端区域格式
```typescript
import { convertFrontendConfigToBackendAreas } from '@/utils/dataAdapter'

const backendAreas = convertFrontendConfigToBackendAreas()
// 返回 [{ name: 'A', nameZh: 'A 区', ... }, ...]
```

### 转换前端配置到后端座位格式
```typescript
import { convertFrontendConfigToBackendSeats } from '@/utils/dataAdapter'

const areaIdMap = { A: 1, B: 2, C: 3 }
const backendSeats = convertFrontendConfigToBackendSeats(areaIdMap)
// 返回座位数组，可用于批量创建
```

### 转换后端座位图到前端座位结构
```typescript
import { convertBackendMapToFrontendSeats } from '@/utils/dataAdapter'

const backendData = { areas: [...] }
const frontendSeats = convertBackendMapToFrontendSeats(backendData)
// 返回扁平化的 Seat[] 数组
```

### 转换后端可用性数据到前端格式
```typescript
import { convertBackendAvailabilityToFrontend } from '@/utils/dataAdapter'

const backendAvailability = [...]
const frontendAvailability = convertBackendAvailabilityToFrontend(backendAvailability)
```

---

## 组合式函数

### useSeats
座位管理组合式函数，位于 `src/composables/useSeats.ts`

```typescript
import { useSeats } from '@/composables/useSeats'

const {
  seats,                    // 所有座位数据
  timeSlots,               // 时间段列表
  seatAvailability,        // 座位可用性数据
  selectedSeat,            // 当前选中的座位 ID
  availableSeatsCount,     // 可用座位数量
  isLoading,              // 加载状态
  isLoadingTimeSlots,     // 时间段加载状态
  isLoadingAvailability,  // 可用性加载状态
  error,                  // 错误信息
  loadSeatMap,            // 加载座位图函数
  loadTimeSlots,          // 加载时间段函数
  querySeatAvailability,  // 查询座位可用性函数
  getSeatsByTable,        // 按表格获取座位函数
  selectSeat,             // 选择座位函数
  clearSelection,         // 清除选择函数
  getSeatColor,           // 获取座位颜色函数
} = useSeats()
```

### useBooking
预订管理组合式函数，位于 `src/composables/useBooking.ts`

```typescript
import { useBooking } from '@/composables/useBooking'

const {
  bookings,           // 预订列表
  isLoading,         // 加载状态
  error,             // 错误信息
  makeBooking,       // 创建预订函数
  loadBookings,      // 加载预订列表函数
  cancelBooking,     // 取消预订函数
} = useBooking()
```

### useInvitation
伙伴邀请管理组合式函数，位于 `src/composables/useInvitation.ts`

```typescript
import { useInvitation } from '@/composables/useInvitation'

const {
  upcomingInvitations,  // 未来邀请列表
  isLoading,           // 加载状态
  error,               // 错误信息
  loadInvitations,     // 加载邀请列表函数
  accept,              // 接受邀请函数
  decline,             // 拒绝邀请函数
} = useInvitation()

// 自动轮询每 30 秒更新一次邀请列表
```

### useAuth
认证管理组合式函数，位于 `src/composables/useAuth.ts`

```typescript
import { useAuth } from '@/composables/useAuth'

const {
  isAuthenticated,  // 是否已登录
  user,            // 当前用户信息
  login,           // 登录函数
  logout,          // 登出函数
  signIn,          // 飞书登录函数
} = useAuth()
```

---

## 常见使用场景

### 场景 1：初始化座位（管理员）
1. 访问 `/admin` 路由
2. 点击"创建 A, B, C 区域"按钮
3. 获取区域 ID 映射
4. 点击"批量创建座位"按钮

### 场景 2：查询座位可用性并预订
1. 用户选择日期和时间段
2. 系统自动调用 `querySeatAvailability` 查询可用座位
3. 用户选择座位
4. 用户邀请伙伴（可选）
5. 调用 `makeBooking` 创建预订

### 场景 3：处理伙伴邀请
1. 系统每 30 秒轮询 `getUpcomingInvitations`
2. 在账户页面显示邀请列表
3. 用户点击"接受"或"拒绝"
4. 调用 `accept` 或 `decline` 函数处理邀请

---

## 错误处理

所有 API 调用都应该使用 try-catch 处理错误：

```typescript
try {
  const result = await makeBooking(bookingData)
  console.log('预订成功:', result)
} catch (error: any) {
  const errorMessage = error.message || error.data?.message || '未知错误'
  console.error('预订失败:', errorMessage)
  // 显示错误提示给用户
}
```

---

## 认证和授权

所有 API 请求都会自动在请求头中添加 Bearer Token：

```typescript
// 在 src/api/index.ts 中的请求拦截器
config.headers.Authorization = `Bearer ${token}`
```

Token 存储在 `localStorage` 中，登录成功后自动保存，登出时自动清除。

---

## 跨域配置

在 `vite.config.ts` 中配置了代理，所有 `/api` 请求都会被转发到后端：

```typescript
proxy: {
  '/api': {
    target: 'https://111.229.50.3/',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path,
  },
}
```

同时添加了 `allowedHosts` 配置以支持代理域名访问。

