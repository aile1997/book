import seatLayout from '../config/seatLayout.json';
import type { SeatConfig, Seat, Area } from '../types/booking';

// -----------------------------------------------------------------------------
// 1. 前端配置 -> 后端 API 结构 (用于批量创建座位)
// -----------------------------------------------------------------------------

/**
 * 将前端的 seatLayout.json 配置转换为后端批量创建座位所需的结构
 * @param areaIdMap 区域名称到 ID 的映射 (e.g., { 'A': 1, 'B': 2, 'C': 3 })
 * @returns 包含所有座位数据的数组
 */
export function convertFrontendConfigToBackendSeats(areaIdMap: { [key: string]: number }): any[] {
  const backendSeats: any[] = [];

  seatLayout.tables.forEach(table => {
    const areaId = areaIdMap[table.id];
    if (!areaId) {
      console.error(`Area ID not found for table: ${table.id}`);
      return;
    }

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
export function convertFrontendConfigToBackendAreas(): any[] {
  return seatLayout.tables.map(table => ({
    name: table.id, // 区域名称使用 table ID
    nameZh: table.label, // 区域中文名称使用 label
    areaType: 'MEETING_ROOM', // 与用户提供的后端数据保持一致
    capacity: table.seats.left.count + table.seats.right.count, // 容量为左右座位数之和
    description: JSON.stringify({ type: table.type }), // 额外的配置信息
  }));
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
        id: String(seat.seatId),
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
