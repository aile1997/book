import seatLayout from '../config/seatLayout.json';
import type { SeatConfig, Seat, Area } from '../types/booking';

// -----------------------------------------------------------------------------
// 1. 前端配置 -> 后端 API 结构 (用于批量创建座位)
// -----------------------------------------------------------------------------

/**
 * 将前端的 seatLayout.json 配置转换为后端批量创建座位所需的结构
 * 简化为只使用一个 areaId (nsd 区域的 ID)
 * @param nsdAreaId nsd 区域的 ID
 * @returns 包含所有座位数据的数组
 */
export function convertFrontendConfigToBackendSeats(nsdAreaId: number): any[] {
  const backendSeats: any[] = [];
  const areaId = nsdAreaId; // 统一使用 nsd 区域的 ID

  seatLayout.tables.forEach(table => {
    // 区域 ID 统一使用 nsdAreaId
    let seatIndex = 0; // 区域内座位总索引

    // 1. 处理左侧座位 (第一列)
    const leftConfig = table.seats.left;
    if (leftConfig) {
      const { count, startX, startY, spacing, width, height, shape, ...extraInfo } = leftConfig;
      for (let i = 0; i < count; i++) {
        seatIndex++;
        // 计算座位编号，例如 A-01, A-02...
        const seatNumber = `${table.id}-${String(seatIndex).padStart(2, '0')}`;

        // 计算座位的位置 (这里简化处理，实际可能需要更复杂的计算)
        // 假设座位是垂直排列，startY 递增
        const positionY = startY + i * spacing;
        const positionX = startX;

        // 将额外的配置信息（如 shape, scale, svgPath 等）存入 description 字段
        const description = JSON.stringify({
          width,
          height,
          shape,
          ...extraInfo,
        });

        backendSeats.push({
          seatNumber: seatNumber,
          table: table.id, // 仍然保留 table 字段，方便后端识别
          areaId: areaId,
          rowNum: i + 1, // 假设 rowNum 就是索引
          columnNum: 1, // 左侧为第一列
          positionX: positionX,
          positionY: positionY,
          description: description,
        });
      }
    }

    // 2. 处理右侧座位 (第二列)
    const rightConfig = table.seats.right;
    if (rightConfig) {
      const { count, startX, startY, spacing, width, height, shape, ...extraInfo } = rightConfig;
      for (let i = 0; i < count; i++) {
        seatIndex++;
        // 计算座位编号，例如 A-07, A-08...
        const seatNumber = `${table.id}-${String(seatIndex).padStart(2, '0')}`;

        // 计算座位的位置 (这里简化处理，实际可能需要更复杂的计算)
        // 假设座位是垂直排列，startY 递增
        const positionY = startY + i * spacing;
        const positionX = startX;

        // 将额外的配置信息（如 shape, scale, svgPath 等）存入 description 字段
        const description = JSON.stringify({
          width,
          height,
          shape,
          ...extraInfo,
        });

        backendSeats.push({
          seatNumber: seatNumber,
          table: table.id, // 仍然保留 table 字段，方便后端识别
          areaId: areaId,
          rowNum: i + 1, // 假设 rowNum 就是索引
          columnNum: 2, // 右侧为第二列
          positionX: positionX,
          positionY: positionY,
          description: description,
        });
      }
    }
  });

  return backendSeats;
}

/**
 * 将前端的 seatLayout.json 配置转换为后端创建区域所需的结构
 * @returns 包含所有区域数据的数组
 */
/**
 * 将前端的 seatLayout.json 配置转换为后端创建区域所需的结构
 * 简化为只创建一个 'nsd' 区域
 * @returns 包含所有区域数据的数组
 */
export function convertFrontendConfigToBackendAreas(): any[] {
  // 假设 seatLayout.json 中有一个顶层配置用于 nsd 区域，如果没有，则手动创建
  // 这里我们手动创建一个名为 'nsd' 的区域
  const totalCapacity = seatLayout.tables.reduce((sum, table) => {
    return sum + (table.seats.left?.count || 0) + (table.seats.right?.count || 0);
  }, 0);

  return [{
    name: 'nsd', // 区域名称固定为 nsd
    nameZh: '某某公司', // 区域中文名称
    areaType: 'MEETING_ROOM', // 保持一致
    capacity: totalCapacity, // 总容量
    description: JSON.stringify({ tables: seatLayout.tables.map(t => t.id).join(',') }), // 记录包含的桌子
  }];
}

// -----------------------------------------------------------------------------
// 2. 后端 API 结构 -> 前端 Seat 结构 (用于座位图展示)
// -----------------------------------------------------------------------------

/**
 * 将后端 API 返回的座位数据结构转换为前端所需的 Seat[] 结构
 * @param backendData 后端 API /api/v1/seats/map 返回的数据
 * @returns 前端 Seat[] 数组
 */
export function convertBackendMapToFrontendSeats(backendData: { areas: Area[] }): Seat[] {
  const frontendSeats: Seat[] = [];

  backendData.areas.forEach(area => {
    // 修复：后端返回的 areaType 可能不是 'SEATING' (例如 'MEETING_ROOM')，
    // 只要区域包含座位，就应该进行处理。
    if (!area.seats || area.seats.length === 0) return;

    area.seats.forEach(seat => {
      // 从 description 中解析出前端所需的渲染信息
      let renderInfo = {};
      try {
        renderInfo = JSON.parse(seat.description || '{}');
      } catch (e) {
        console.error('Failed to parse seat description:', seat.description);
      }

      // 确定座位状态
      let status: Seat['status'] = 'available';
      if (!seat.isAvailable) {
        status = 'occupied';
      }
      // 如果有预订信息，则显示被占用
      if (seat.bookingUserInfo) {
        status = 'occupied';
      }

      frontendSeats.push({
        id: seat.seatNumber, // 使用 seatNumber 作为前端 Seat ID (例如: A-01)
        table: seat.table || area.name, // 使用 table 字段或 area name
        position: seat.columnNum === 1 ? 'left' : 'right', // 假设 1 是 left, 2 是 right
        index: seat.rowNum || 0,
        status: status,
        occupiedBy: seat.bookingUserInfo ? seat.bookingUserInfo.userName : '',
        // 将渲染信息合并到 Seat 对象中，以便 SeatMap 组件使用
        ...renderInfo,
        // 原始后端 ID
        backendSeatId: seat.seatId,
      } as Seat);
    });
  });

  return frontendSeats;
}

// -----------------------------------------------------------------------------
// 3. 后端 API 结构 -> 前端可用性结构 (用于 FindPartnerModal)
// -----------------------------------------------------------------------------

/**
 * 将后端 API 返回的座位可用性数据转换为前端所需的结构
 * @param backendData 后端 API /api/v1/seats/availability 返回的数据
 * @returns 包含可用座位信息的数组
 */
export function convertBackendAvailabilityToFrontend(backendData: any): any[] {
  // 假设后端返回的是一个包含 Area 信息的数组
  return backendData.map((area: any) => ({
    areaId: area.areaId,
    areaName: area.areaName,
    availableSeats: area.availableSeats.map((seat: any) => ({
      seatId: seat.seatId,
      seatNumber: seat.seatNumber,
      // ... 其他可用性信息
    })),
  }));
}
