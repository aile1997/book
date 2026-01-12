# API 接口变动文档（前端交付）

## 变动概述

本次更新主要涉及以下接口变动：

| 接口 | 变动类型 |
|------|----------|
| POST `/api/v1/bookings` | 重大变更 - 多时间段预订 |
| PUT `/api/v1/bookings/swap-seat` | 重大变更 - 入参重构，支持邀请伙伴 |
| POST `/api/v1/partner-invitations/{invitationId}/accept` | 返回值变更 |
| POST `/api/v1/partner-invitations/{invitationId}/decline` | 返回值变更 |
| POST `/api/v1/seats/availability` | 重大变更 - 批量查询 |

---

## 1. 创建预订

**接口**: `POST /api/v1/bookings`

### 请求示例

```json
{
  "areaId": 1,
  "seatId": 60,
  "timeSlots": [
    {
      "bookingDate": "2026-01-15",
      "timeSlotId": 1
    }
  ],
  "invitePartners": [
    {
      "userId": "ou_xxxxxxxxxxxxxxxx",
      "openId": "o_xxxxxxxxxxxxxxxx",
      "username": "zhangsan",
      "seatId": 61
    }
  ]
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "creatorUserId": 1,
    "creatorName": "李四",
    "seatId": 60,
    "seatNumber": "A01",
    "areaId": 1,
    "areaName": "办公区A",
    "groupStatus": "ACTIVE",
    "totalCreditsUsed": 15,
    "createdAt": "2026-01-10T10:00:00",
    "updatedAt": "2026-01-10T10:00:00",
    "timeSlotDetails": [
      {
        "id": 1,
        "bookingDate": "2026-01-15",
        "timeSlotId": 1,
        "timeSlotName": "上午时段",
        "startTime": "09:00",
        "endTime": "12:00",
        "creditsRequired": 5,
        "slotStatus": "ACTIVE",
        "bookingId": 1,
        "seatId": 60,
        "areaId": 1
      }
    ],
    "partnerInvitations": [
      {
        "invitationId": 1,
        "partnerUserId": 2,
        "partnerName": "张三",
        "invitationStatus": "PENDING",
        "invitedAt": "2026-01-10T10:00:00",
        "respondedAt": null
      }
    ]
  }
}
```

---

## 2. 更换座位

**接口**: `PUT /api/v1/bookings/swap-seat`

### 请求示例

```json
{
  "bookingId": 1,
  "newSeatId": 5,
  "invitePartners": [
    {
      "userId": "ou_xxxxxxxxxxxxxxxx",
      "openId": "o_xxxxxxxxxxxxxxxx",
      "username": "zhangsan",
      "seatId": 61
    }
  ]
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 3. 查询座位可用性

**接口**: `POST /api/v1/seats/availability`（原 GET 改为 POST）

### 请求示例

```json
[
  {
    "areaId": 1,
    "bookingDate": "2026-01-15",
    "timeSlotId": 1
  }
]
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "bookingDate": "2026-01-15",
      "timeSlotId": 1,
      "areaId": 1,
      "seats": [
        {
          "seatId": 60,
          "seatNumber": "A01",
          "table": "1号桌",
          "areaName": "办公区A",
          "rowNum": 1,
          "columnNum": 1,
          "positionX": 100.50,
          "positionY": 200.50,
          "isAvailable": true,
          "bookingUserInfo": null,
          "groupId": null
        }
      ]
    }
  ]
}
```

---

## 4. 接受邀请

**接口**: `POST /api/v1/partner-invitations/{invitationId}/accept`

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 5. 拒绝邀请

**接口**: `POST /api/v1/partner-invitations/{invitationId}/decline`

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 6. 获取邀请列表

**接口**: `GET /api/v1/partner-invitations/upcoming`

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "bookingId": 1,
      "inviterUserId": 1,
      "inviterName": "李四",
      "invitationStatus": "PENDING",
      "invitedAt": "2026-01-10T10:00:00",
      "respondedAt": null,
      "timeSlotDetails": [
        {
          "bookingDate": "2026-01-15",
          "timeRange": "09:00~12:00",
          "timeSlotId": 1,
          "seatId": 61
        }
      ],
      "isMultiTimeSlot": true
    }
  ]
}
```

---

## 7. 我的预订列表

**接口**: `GET /api/v1/bookings`

**参数**: `skip=0&limit=20`

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "bookings": [
      {
        "id": 1,
        "userId": 1,
        "status": "CONFIRMED",
        "creditsUsed": 15,
        "checkInTime": null,
        "checkOutTime": null,
        "cancellationReason": null,
        "createdAt": "2026-01-10T10:00:00",
        "updatedAt": "2026-01-10T10:00:00",
        "partners": [
          {
            "id": 1,
            "bookingId": 1,
            "partnerUserId": 2,
            "inviterUserId": 1,
            "partnerName": "张三",
            "invitationStatus": "ACCEPTED",
            "invitedAt": "2026-01-10T10:00:00",
            "respondedAt": "2026-01-10T10:30:00"
          }
        ],
        "timeSlotDetails": [
          {
            "id": 1,
            "bookingDate": "2026-01-15",
            "timeSlotId": 1,
            "timeSlotName": "上午时段",
            "startTime": "09:00",
            "endTime": "12:00",
            "creditsRequired": 5,
            "slotStatus": "ACTIVE",
            "bookingId": 1,
            "seatId": 60,
            "areaId": 1
          },
          {
            "id": 2,
            "bookingDate": "2026-01-16",
            "timeSlotId": 1,
            "timeSlotName": "上午时段",
            "startTime": "09:00",
            "endTime": "12:00",
            "creditsRequired": 5,
            "slotStatus": "ACTIVE",
            "bookingId": 1,
            "seatId": 60,
            "areaId": 1
          }
        ]
      }
    ]
  }
}
```

---

## 8. 获取预订详情

**接口**: `GET /api/v1/bookings/{bookingId}`

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "userId": 1,
    "status": "CONFIRMED",
    "creditsUsed": 5,
    "checkInTime": null,
    "checkOutTime": null,
    "cancellationReason": null,
    "createdAt": "2026-01-10T10:00:00",
    "updatedAt": "2026-01-10T10:00:00",
    "partners": [
      {
        "id": 1,
        "bookingId": 1,
        "partnerUserId": 2,
        "inviterUserId": 1,
        "partnerName": "张三",
        "invitationStatus": "ACCEPTED",
        "invitedAt": "2026-01-10T10:00:00",
        "respondedAt": "2026-01-10T10:30:00"
      }
    ],
    "timeSlotDetails": [
      {
        "id": 1,
        "bookingDate": "2026-01-15",
        "timeSlotId": 1,
        "timeSlotName": "上午时段",
        "startTime": "09:00",
        "endTime": "12:00",
        "creditsRequired": 5,
        "slotStatus": "ACTIVE",
        "bookingId": 1,
        "seatId": 60,
        "areaId": 1
      }
    ]
  }
}
```
