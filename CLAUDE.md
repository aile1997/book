# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述（Project Overview）

这是一个基于 Vue 3、TypeScript 和 TailwindCSS 构建的座位预订系统。用户可以通过交互式座位地图界面预订休息室/工作区的座位、邀请伙伴并管理预订。系统集成了后端 API，支持认证、座位可用性查询和预订管理功能。

## 开发规范（Development Standards）

### 语言和交流规范

1. **全程使用中文进行技术交流** - 与用户的所有技术讨论、问题回答、方案建议必须使用中文。
2. **代码注释必须使用中文** - 所有代码注释、函数说明、变量注释都必须用中文编写，保证团队成员能够快速理解代码意图。
3. **文档必须使用中文** - 设计文档、需求文档、技术方案、任务列表、README 等所有项目文档都必须使用中文。

### 专业术语使用规范

使用高级前端开发工程师的专业术语，包括但不限于：

- **组合式 API** (Composition API) - 而非"Composition API"
- **响应式原理** (Reactivity) - 而非"响应式系统"
- **依赖注入** (Dependency Injection)
- **解耦** (Decoupling) - 模块、组件、逻辑的分离
- **副作用** (Side Effects) - 在纯函数外的操作
- **状态提升** (State Lifting)
- **受控组件** (Controlled Components)
- **高阶组件** (Higher-Order Components)
- **函数式编程** (Functional Programming)
- **声明式编程** (Declarative Programming)
- **命令式编程** (Imperative Programming)
- **依赖收集** (Dependency Tracking)
- **派发更新** (Dispatch Updates)
- **虚拟 DOM** (Virtual DOM)
- **DOM Diff 算法**
- **树的递归遍历**
- **闭包** (Closure)
- **作用域链** (Scope Chain)
- **原型链** (Prototype Chain)
- **事件循环** (Event Loop)
- **宏任务与微任务** (Macro/Micro Tasks)
- **防抖与节流** (Debounce & Throttle)
- **惰性加载** (Lazy Loading)
- **代码分割** (Code Splitting)
- **摇树优化** (Tree Shaking)

### 代码注释示例规范

```typescript
// ✅ 正确示例：使用中文注释
/**
 * 查询指定日期和时间段的座位可用性
 * @param bookingDate - 预订日期，格式 YYYY-MM-DD
 * @param timeSlotId - 时间段 ID（0=上午, 1=下午）
 * @param areaId - 区域 ID
 * @returns 返回座位可用性数据
 */
async function querySeatAvailability(
  bookingDate: string,
  timeSlotId: number,
  areaId: number,
): Promise<SeatAvailability[]> {
  // 构建查询参数
  const params = { bookingDate, timeSlotId, areaId }

  // 调用 API 获取座位可用性
  const response = await apiClient.get('/api/v1/seats/availability', { params })

  // 转换后端数据为前端格式
  return convertBackendAvailabilityToFrontend(response)
}

// ❌ 错误示例：使用英文注释
/**
 * Query seat availability for specified date and time slot
 * @param bookingDate - Booking date in YYYY-MM-DD format
 * @param timeSlotId - Time slot ID (0=morning, 1=afternoon)
 * @param areaId - Area ID
 * @returns Seat availability data
 */
```

### Git 提交信息规范

提交信息必须使用中文，遵循约定式提交规范：

```bash
feat: 添加座位实时可用性查询功能
fix: 修复伙伴邀请弹窗关闭后状态未重置的问题
refactor: 重构座位地图组件，优化 SVG 渲染性能
docs: 更新 API 集成文档，补充认证流程说明
style: 统一 TailwindCSS 类名顺序
perf: 优化座位可用性查询，添加请求缓存机制
test: 添加 useBooking 组合式函数的单元测试
chore: 升级 Vue 到 3.5.17 版本
```

## 开发命令（Development Commands）

```bash
# 安装依赖
npm install

# 启动开发服务器（包含后端 API 代理）
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 使用 Vitest 运行单元测试
npm run test:unit

# 使用 vue-tsc 进行类型检查
npm run type-check

# 使用 ESLint 进行代码检查并自动修复
npm run lint

# 使用 Prettier 格式化代码
npm run format
```

## 架构概览（Architecture Overview）

### 核心技术栈（Core Technology Stack）

- **前端框架**：Vue 3.5.17，使用组合式 API（`<script setup>` 语法）
- **开发语言**：TypeScript 5（全项目使用）
- **样式方案**：TailwindCSS 3.4.11（实用优先 Utility-First 方法）
- **路由管理**：Vue Router 4，集成 NProgress 加载指示器
- **构建工具**：Vite 7
- **测试框架**：Vitest + Vue Test Utils
- **HTTP 客户端**：Axios，配置拦截器处理认证和错误

### 项目结构（Project Structure）

```
src/
├── api/                    # API 层（axios 客户端）
│   └── index.ts           # 所有 API 端点、请求/响应拦截器
├── assets/                # 静态资源（CSS、图片）
├── components/            # Vue 组件（按用途组织）
│   ├── common/           # 通用可复用 UI 组件（FAB、Toast）
│   ├── features/         # 特定功能组件（SeatMap）
│   ├── layout/           # 布局组件（LoadingScreen、Logo）
│   └── modals/           # 模态弹窗（SeatSelection、FindPartner 等）
├── composables/          # 组合式 API 逻辑（状态 + 业务逻辑）
│   ├── useAuth.ts       # 认证状态和操作
│   ├── useSeats.ts      # 座位数据、可用性查询、选择逻辑
│   ├── useBooking.ts    # 预订创建和管理
│   ├── useInvitations.ts # 伙伴邀请处理
│   ├── usePartners.ts   # 伙伴搜索和管理
│   └── useToast.ts      # 提示通知系统
├── pages/                # 页面级组件（路由）
│   ├── HomePage.vue
│   ├── BookingPage.vue  # 主预订界面
│   ├── AccountPage.vue  # 用户账户和邀请
│   ├── AdminPage.vue    # 管理员座位设置工具
│   ├── CoinStorePage.vue
│   └── PresentationPage.vue
├── router/               # Vue Router 配置
│   └── index.ts         # 路由定义（集成 NProgress）
├── types/                # TypeScript 类型定义
│   ├── booking.ts       # 预订相关类型
│   └── seatConfig.ts    # 座位配置类型
├── utils/                # 工具函数
│   ├── dataAdapter.ts   # 前端 ↔ 后端数据转换
│   ├── errorHandler.ts  # API 错误解析
│   ├── cache.ts         # 本地缓存工具
│   ├── debounce.ts      # 防抖辅助函数
│   ├── throttle.ts      # 节流辅助函数
│   └── time.ts          # 时间格式化工具
├── config/               # 配置文件
└── main.ts              # 应用入口
```

### 关键架构模式（Key Architectural Patterns）

#### 1. 组合式函数模式（Composables Pattern）

所有业务逻辑和状态管理都封装在组合式函数中（Vue 的组合式 API 模式）。每个组合式函数处理特定领域：

- `useSeats`：管理座位数据、可用性查询和选择状态
- `useBooking`：处理预订创建、列表和取消
- `useAuth`：认证状态、登录/登出操作
- `useInvitations`：伙伴邀请生命周期（自动轮询）
- `usePartners`：伙伴搜索（支持中文拼音）

#### 2. API 层架构（API Layer Architecture）

- `src/api/index.ts` 中单一 axios 实例，配置基础 URL
- 请求拦截器自动从 localStorage 添加 JWT Bearer Token
- 响应拦截器：
  - 处理 401 错误，使用令牌刷新队列机制
  - 规范化响应数据（解包 `data` 或 `result` 键）
  - 通过 `errorHandler` 将错误解析为用户友好的消息

#### 3. 数据适配器模式（Data Adapter Pattern）

`src/utils/dataAdapter.ts` 提供前端模型和后端 API 模型之间的转换函数：

- `convertBackendMapToFrontendSeats`：后端座位地图 → 前端 Seat[]
- `convertBackendAvailabilityToFrontend`：后端可用性 → 前端格式
- `convertFrontendConfigToBackendAreas`：前端配置 → 后端区域创建
- `convertFrontendConfigToBackendSeats`：前端配置 → 后端座位创建

#### 4. 组件组织（Component Organization）

组件按用途组织，而非按功能：

- **common/**：通用可复用 UI 组件（FloatingActionButton、Toast）
- **features/**：领域特定组件（SeatMap，支持 SVG 渲染）
- **modals/**：所有模态弹窗，保持一致的用户体验
- **layout/**：布局和结构组件

#### 5. 路由加载状态（Routing with Loading States）

- 集成 NProgress 用于全局路由转换
- 某些路由（`BookingPage`、`AccountPage`）使用 `manualNProgress: true` meta 标记，在涉及数据获取时手动控制加载状态

### 后端 API 集成（Backend API Integration）

后端 API 通过 Vite 开发服务器代理（参见 `vite.config.ts`）：

```typescript
proxy: {
  '/api': {
    target: 'http://111.229.50.3:8080/',
    changeOrigin: true,
    secure: false,
  }
}
```

所有 API 请求通过 `/api/v1/*` 端点：

- **认证**：`/api/v1/auth/login`、`/api/v1/auth/register`、`/api/v1/auth/logout`
- **座位**：`/api/v1/seats/map`、`/api/v1/seats/availability`、`/api/v1/seats/timeslots`
- **预订**：`/api/v1/bookings`（CRUD 操作）
- **邀请**：`/api/v1/partner-invitations/upcoming`、接受/拒绝端点
- **管理员**：`/api/v1/admin/areas`、`/api/v1/admin/seats/batch`

参考 `API_INTEGRATION_GUIDE.md` 获取完整 API 文档。

### 状态管理策略（State Management Strategy）

本项目使用 Vue 3 组合式 API 代替 Vuex/Pinia：

- 每个组合式函数使用 `ref()` 和 `reactive()` 管理自己的响应式状态
- 组合式函数初始化一次并在组件间共享（单例模式）
- 状态按逻辑领域划分（认证、座位、预订等）
- 副作用（API 调用）封装在组合式函数内部
- 组件使用组合式函数并保持展示性

### 座位地图系统（Seat Map System）

座位地图是一个复杂的基于 SVG 的交互组件：

- 座位根据 `description` JSON 渲染为 SVG 形状（圆形、半圆形）
- 支持三个区域（A、B、C），左右两侧定位
- 实时状态更新：`available`（可用）、`occupied`（已占用）、`selected`（已选中）
- 可用性查询由日期/时间选择触发
- 位置坐标（`positionX`、`positionY`）控制 SVG 位置

## 重要实现细节（Important Implementation Details）

### 认证流程（Authentication Flow）

1. 用户通过 `/api/v1/auth/login` 登录
2. JWT 令牌存储在 localStorage 中，键名为 `authToken`
3. 请求拦截器为所有请求添加 `Authorization: Bearer {token}` 头
4. 收到 401 响应时，令牌刷新队列机制防止多次刷新尝试
5. 如果刷新失败，用户被重定向到登录页面

### 预订流程（Booking Flow）

1. 用户从 SeatMap 选择座位（触发 `useSeats` 中的 `selectSeat`）
2. 用户选择日期和时间段
3. `querySeatAvailability` 获取所选日期/时间/区域的实时可用性
4. 用户可选择通过 FindPartnerModal 邀请伙伴
5. `makeBooking` 发送预订请求，包含 `partnerSeatMap`（userId → seatId 映射）
6. 后端返回预订信息，伙伴邀请状态为 `PENDING`

### 伙伴邀请系统（Partner Invitation System）

- `useInvitations` 组合式函数每 30 秒轮询 `/api/v1/partner-invitations/upcoming`
- AccountPage 显示待处理的邀请
- 用户可以接受/拒绝邀请
- 已接受的邀请将用户关联到预订

### 中文姓名搜索（Chinese Name Search）

使用 `pinyin-match` 库在伙伴搜索中进行模糊拼音匹配。支持：

- 完整中文字符
- 拼音（带或不带声调）
- 部分匹配

### 提示通知系统（Toast Notification System）

- `useToast` 提供全局提示通知
- ToastContainer 组件渲染所有提示
- 可配置持续时间后自动关闭
- 类型：success（成功）、error（错误）、warning（警告）、info（信息）

## 测试策略（Testing Strategy）

- 单元测试使用 Vitest 和 Vue Test Utils
- 测试文件位于 `src/components/__tests__/`
- 运行测试：`npm run test:unit`
- 重点测试组合式函数逻辑和组件行为

## 构建与部署（Build and Deployment）

- `npm run build` 在 `dist/` 目录创建优化的生产构建
- 构建时注入 `__APP_VERSION__` 时间戳用于缓存清除
- 部署前运行 `npm run type-check` 进行类型检查
- Vite 自动处理代码分割和优化

## 常见开发任务（Common Development Tasks）

### 添加新的 API 端点（Adding a New API Endpoint）

1. 在 `src/api/index.ts` 中添加端点函数
2. 在 `src/types/` 中定义请求/响应的 TypeScript 接口
3. 在组合式函数中使用该端点（如 `useSeats`、`useBooking`）
4. 使用 try-catch 和 `parseApiError` 处理错误

### 创建新页面（Creating a New Page）

1. 在 `src/pages/` 中创建组件
2. 在 `src/router/index.ts` 中添加路由
3. 导入必要的组合式函数进行数据获取
4. 如需要，添加到导航菜单

### 添加新的组合式函数（Adding a New Composable）

1. 在 `src/composables/use{Feature}.ts` 中创建文件
2. 导出响应式状态和方法
3. 对基本类型使用 `ref()`，对象使用 `reactive()`
4. 返回所有公共状态和方法
5. 在组件中通过 `const { ... } = use{Feature}()` 导入使用

### 更新座位配置（Updating Seat Configuration）

- 前端座位配置：`src/config/seatConfig.ts`（已弃用，现从后端获取）
- 后端数据适配器：`src/utils/dataAdapter.ts`
- 管理员页面允许从前端配置初始化后端座位数据

## 代码风格规范（Code Style Conventions）

- 所有 Vue 组件使用 `<script setup lang="ts">`
- 所有 props 和 emits 使用 TypeScript 接口定义
- 优先使用 TailwindCSS 实用类，而非自定义 CSS
- 保持组件小而专注（单一职责原则）
- 将复杂逻辑提取到组合式函数中
- 使用描述性变量名（除循环计数器外不使用单字母）
- 异步操作始终使用 try-catch 处理错误
- 所有 API 调用使用 `await`（不使用 `.then()` 链）

## 环境配置（Environment Configuration）

- `.env` 文件包含环境变量（不提交到 git）
- Vite 暴露以 `VITE_` 为前缀的环境变量
- 当前代理目标可在 `vite.config.ts` 中配置

## 核心依赖（Key Dependencies）

- **axios**：用于 API 调用的 HTTP 客户端
- **nprogress**：路由转换加载条
- **pinyin-match**：中文拼音模糊匹配
- **vue-router**：路由库
- **tailwindcss**：实用优先 CSS 框架
- **postcss**：CSS 处理（配合 autoprefixer）

## 当前开发进度（Current Development Progress）

### 最近完成（2026-01-13）
- ✅ **多时段批量处理重构**：实现支持最多 4 个时段的批量预订系统
  - 批量座位可用性查询 API 集成（`POST /api/v1/seats/availability`）
  - 多时段选择逻辑（`selectedTimeSlots[]` 状态管理）
  - 批量换座功能（应用到所有选定时段）
  - 时段置灰逻辑（选中座位不可用时自动禁用）
- ✅ **BookingHistoryModal 重构**
  - 将 `aggregatedBookings` 逻辑从 BookingPage 移入组件内部
  - 修复 seat 字段显示问题（分离 `seat` 和 `table` 字段）
  - 绿色主题 UI（#39D37F）
  - 支持按 groupId 聚合显示多时段预订
- ✅ **API 集成优化**
  - 创建预订支持多时段 `timeSlots[]` 参数
  - 换座 API 支持邀请伙伴 `invitePartners[]` 参数
  - 预订历史支持 `timeSlotDetails[]` 格式

### 进行中
- 🔄 **座位多选逻辑重构**：从单选升级为最多 6 个座位的多选功能

### 计划中
- 多选逻辑的完整实现（类型定义、状态管理、组件更新）
- UI 增强以支持选择计数器和顺序显示
- 预订流程适配多座位场景

---

## 多时段预订架构设计（Multi-Time Slot Booking Architecture）

### 核心数据流

```
用户选择时段 → selectedTimeSlots[]
    ↓
批量查询可用性 → POST /api/v1/seats/availability
    ↓
batchAvailabilityData[] ← 存储所有时段的座位数据
    ↓
座位状态更新（AND 逻辑：所有时段都可用才算可用）
    ↓
用户选座 → 批量预订 → POST /api/v1/bookings
```

### 关键文件与职责

| 文件 | 职责 |
|------|------|
| `src/pages/BookingPage.vue` | 时段选择 UI、批量查询触发、预订流程 |
| `src/composables/useSeats.ts` | `queryBatchSeatAvailability()`、`updateSeatsStatus()`（批量模式） |
| `src/components/modals/BookingHistoryModal.vue` | 内置 `aggregatedBookings` 计算属性，聚合展示多时段预订 |
| `src/api/index.ts` | `postSeatAvailability()`、`createBooking()`、`swapSeat()` |

### 多时段选择状态结构

```typescript
interface SelectedTimeSlot {
  key: string          // 唯一标识："2026-01-15_1"
  dateISO: string      // ISO 日期格式
  date: string         // 显示日期："01.15"
  weekday: string      // 星期："MON"
  timeSlotId: string   // 时段 ID
  time: string         // 时间范围："09:00 - 12:00"
  isExpired: boolean   // 是否过期
}

// 最多选择 4 个时段
const selectedTimeSlots = ref<SelectedTimeSlot[]>([])
```

### 批量查询响应结构

```typescript
// POST /api/v1/seats/availability 响应
interface BatchSeatAvailabilityResponse {
  bookingDate: string
  timeSlotId: number
  areaId: number
  seats: Array<{
    seatId: number
    seatNumber: string
    isAvailable: boolean
    bookingUserInfo: { userId, userName, bookingId? } | null
    groupId: number | null
  }>
}
```

### 座位状态更新逻辑（批量模式）

**核心原则**：使用 AND 逻辑合并多个时段的可用性

```typescript
// 只要有一个时段不可用，座位整体就不可用
existing.isAvailable = existing.isAvailable && seat.isAvailable

// 如果是当前用户的预订，优先显示我的预订信息
if (seat.bookingUserInfo?.userId === currentUserId) {
  existing.bookingInfo = seat.bookingUserInfo
  existing.bookingId = seat.bookingId || seat.bookingUserInfo?.bookingId
}
```

### 预订历史聚合逻辑

**关键**：`bookings[i]` 与 `timeSlots[i]` 保持一一对应

```typescript
// 1. 按 groupId 分组
// 2. 展平 timeSlotDetails，创建 booking-timeSlot 配对
// 3. 按日期和时间排序
// 4. 提取 seat、table、totalCredits

interface BookingGroup {
  groupId: number
  seat: string          // 完整座位号："A1"
  table: string         // 桌号："A"
  timeSlots: TimeSlotDetail[]  // 与 bookings[] 一一对应
  totalCredits: number
  bookings: RawBooking[]       // 与 timeSlots[] 一一对应
}
```

### 取消预订逻辑

**重要**：取消整组预订，取第一个 booking 的 ID

```typescript
const cancelBooking = (group: BookingGroup) => {
  const target = group.bookings[0]  // 取第一个预订
  const id = target?.id || target?.bookingId
  emit('cancel-booking', id)
}
```

### 时段置灰逻辑

**触发时机**：用户选中座位后，批量查询其他时段的可用性

**逻辑**：如果当前选中的座位在某个时段不可用，禁用该时段

```typescript
// 遍历所有时段，检查选中座位的可用性
const seatInSlot = matchingSlot.seats.find(s => s.seatId === bookedSeatBackendId)
if (seatInSlot && !seatInSlot.isAvailable) {
  time.disabled = true  // 禁用该时段
}
```

---

## 相关文档（Related Documentation）

- `API_INTEGRATION_GUIDE.md`：完整 API 参考和示例
- `BOOKING_SYSTEM_README.md`：功能概览和组件文档
- `QUICK_START.md`：用户指南和功能演示（中文）
- `AGENTS.md`：项目元数据和架构说明
- `.claude/project_context.md`：详细项目上下文和技术债务分析
