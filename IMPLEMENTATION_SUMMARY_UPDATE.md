# 企业选座系统前后端交互优化总结

根据用户提供的需求和代码库分析，本次优化和完善工作主要集中在以下几个方面：

## 1. API 接口层 (src/api/index.ts)

- **新增用户搜索接口：** 实现了 `searchUsers(query: string, limit?: number)` 函数，用于调用 `GET /api/v1/users/search` 接口，支持邀请伙伴时的用户搜索功能。
- **优化座位可用性查询接口：** 修改 `getSeatAvailability` 函数，使其 `areaId` 参数变为可选 (`areaId?: number`)，以支持在不指定区域 ID 时查询所有区域的座位可用性，满足选座页面一次性查询所有区域数据的需求。

## 2. 数据适配层 (src/utils/dataAdapter.ts)

- **座位数据适配：** 确认 `convertBackendMapToFrontendSeats` 函数已实现将后端 `/api/v1/seats/map` 返回的区域-座位结构转换为前端所需的扁平化 `Seat[]` 结构，并从 `description` 字段中解析渲染信息。
- **可用性数据适配：** 确认 `convertBackendAvailabilityToFrontend` 函数已实现将后端 `/api/v1/seats/availability` 返回的可用性数据转换为前端所需格式。

## 3. 组合式函数层

### 3.1. 座位管理 (src/composables/useSeats.ts)

- **优化可用性查询逻辑：** 修改 `querySeatAvailability` 函数，使其在未传入 `areaId` 时，不向后端传递该参数，从而实现查询所有区域可用性的功能。
- **移除伙伴管理逻辑：** 将 `usePartners` 逻辑从 `useSeats.ts` 中剥离，以实现模块化。

### 3.2. 伙伴管理 (src/composables/usePartners.ts)

- **新增 `usePartners` 模块：** 创建新的 `src/composables/usePartners.ts` 文件，包含以下功能：
    - **Find Partner 逻辑：** 继承原有的 `bookedPartners`、`allTables`、`getPartnersByTable`、`getSeatsForTable` 逻辑，用于查找已预订座位的伙伴。
    - **Invite Partner 逻辑：** 新增 `searchUsersForInvite(query: string)` 函数，调用 `searchUsers` API，用于邀请新伙伴时的用户搜索，明确区分了 **Invite Partner** (通过搜索用户) 和 **Find Partner** (通过查询已预订座位) 的搜索方式。

### 3.3. 预订管理 (src/composables/useBooking.ts)

- **预订创建：** 确认 `makeBooking` 函数调用 `createBooking` API，并能正确处理包含 `partnerSeatMap` 字段的预订数据，符合用户要求。

### 3.4. 邀请管理 (src/composables/useInvitation.ts)

- **邀请处理和轮询：** 确认 `useInvitation` 模块已实现：
    - `loadInvitations`：调用 `getUpcomingInvitations` 轮询获取未来邀请列表。
    - `accept(invitationId)`：调用 `acceptInvitation` 接受邀请。
    - `decline(invitationId)`：调用 `declineInvitation` 拒绝邀请。
    - **自动轮询机制：** 使用 `onMounted` 和 `setInterval` 实现了每 30 秒自动轮询更新邀请列表的功能。

## 总结

所有核心功能，包括 API 接口、数据适配和前端逻辑，均已根据用户要求进行了实现和优化。下一步是进行全面的功能测试和验证。
