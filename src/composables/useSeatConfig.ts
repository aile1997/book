/**
 * 座位配置加载器
 * 用于加载和管理座位布局配置
 */

import { ref, computed } from 'vue'
import type { SeatLayoutConfig, TableConfig, SeatGroupConfig } from '../types/seatConfig'
import seatLayoutConfig from '../config/seatLayout.json'

/**
 * 图标偏移配置
 * 统一管理所有图标的偏移量，避免魔法数字分散在代码中
 */
interface IconOffsetConfig {
  // 勾选标记的偏移量
  checkmark: {
    x: number // X轴偏移（正数向内，负数向外）
    y: number // Y轴偏移
  }
  // 用户图标的偏移量
  userIcon: {
    x: number // X轴偏移
    y: number // Y轴偏移
    iconSize: number // 图标尺寸（用于居中计算）
  }
  // Tooltip的偏移量
  tooltip: {
    x: number // X轴偏移
    y: number // Y轴偏移
  }
}

/**
 * 偏移配置表
 * 按桌子和侧边分组，支持 A/B 标准区和 C 特殊区的不同偏移
 */
const OFFSET_CONFIGS: Record<string, Record<'left' | 'right', IconOffsetConfig>> = {
  // A区、B区：标准半圆形座位
  A: {
    left: {
      checkmark: { x: -3, y: 0 },
      userIcon: { x: -2, y: 0, iconSize: 8 },
      tooltip: { x: 0, y: 0 },
    },
    right: {
      checkmark: { x: 3, y: 0 },
      userIcon: { x: 3, y: 0, iconSize: 8 },
      tooltip: { x: 0, y: 0 },
    },
  },
  B: {
    left: {
      checkmark: { x: -3, y: 0 },
      userIcon: { x: -2, y: 0, iconSize: 8 },
      tooltip: { x: 0, y: 0 },
    },
    right: {
      checkmark: { x: 3, y: 0 },
      userIcon: { x: 3, y: 0, iconSize: 8 },
      tooltip: { x: 0, y: 0 },
    },
  },
  // C区：异形座位，需要更大的偏移量以适应形状
  C: {
    left: {
      checkmark: { x: -2, y: -1 },
      userIcon: { x: -1, y: -1, iconSize: 8 },
      tooltip: { x: -2, y: -1 },
    },
    right: {
      checkmark: { x: -17, y: -1 },
      userIcon: { x: -16.5, y: -1, iconSize: 8 },
      tooltip: { x: -16, y: -1 },
    },
  },
}

export function useSeatConfig() {
  // 加载配置
  const config = ref<SeatLayoutConfig>(seatLayoutConfig as SeatLayoutConfig)

  // 获取视口配置
  const viewport = computed(() => config.value.viewport)

  // 获取颜色配置
  const colors = computed(() => config.value.colors)

  // 获取所有桌子配置
  const tables = computed(() => config.value.tables)

  // 根据ID获取桌子配置
  const getTableById = (tableId: string): TableConfig | undefined => {
    return tables.value.find((table) => table.id === tableId)
  }

  // 获取座位组配置
  const getSeatGroupConfig = (
    tableId: string,
    position: 'left' | 'right',
  ): SeatGroupConfig | undefined => {
    const table = getTableById(tableId)
    return table?.seats[position]
  }

  // 计算座位的Y坐标
  const calculateSeatY = (groupConfig: SeatGroupConfig, index: number): number => {
    return groupConfig.startY + index * groupConfig.spacing - 20
  }

  // 计算座位的X坐标（通常使用配置中的startX）
  const calculateSeatX = (groupConfig: SeatGroupConfig): number => {
    return groupConfig.startX
  }

  /**
   * 计算座位中心点位置
   * 这是所有图标和tooltip的基准位置
   */
  const calculateSeatCenter = (
    groupConfig: SeatGroupConfig,
    index: number,
  ): { x: number; y: number } => {
    const x = calculateSeatX(groupConfig)
    const y = calculateSeatY(groupConfig, index)
    const { width, height, shape } = groupConfig

    if (shape === 'custom-svg') {
      // 自定义SVG座位的中心
      return {
        x: x + (groupConfig.width || 17) / 2,
        y: y + (groupConfig.height || 19) / 2,
      }
    } else {
      // 标准半圆形座位的中心
      return {
        x: x + width / 2,
        y: y + height / 2,
      }
    }
  }

  /**
   * 计算勾选标记位置（基于座位中心 + 偏移配置）
   */
  const calculateCheckmarkPosition = (
    groupConfig: SeatGroupConfig,
    index: number,
    tableId: string,
    side: 'left' | 'right',
  ): { cx: number; cy: number } => {
    const center = calculateSeatCenter(groupConfig, index)
    const offset = OFFSET_CONFIGS[tableId]?.[side]?.checkmark || { x: 0, y: 0 }

    return {
      cx: center.x + offset.x,
      cy: center.y + offset.y,
    }
  }

  /**
   * 计算用户图标位置（基于座位中心 + 偏移配置）
   */
  const calculateUserIconPosition = (
    groupConfig: SeatGroupConfig,
    index: number,
    tableId: string,
    side: 'left' | 'right',
  ): { x: number; y: number } => {
    const center = calculateSeatCenter(groupConfig, index)
    const offset = OFFSET_CONFIGS[tableId]?.[side]?.userIcon || { x: 0, y: 0, iconSize: 8 }

    // 图标位置 = 中心 + 偏移 - 图标尺寸的一半（居中）
    return {
      x: center.x + offset.x - offset.iconSize / 2,
      y: center.y + offset.y - offset.iconSize / 2,
    }
  }

  /**
   * 计算Tooltip位置（基于座位中心 + 偏移配置）
   * Tooltip自动居中显示在座位上方
   */
  const calculateTooltipPosition = (
    groupConfig: SeatGroupConfig,
    index: number,
    tableId: string,
    side: 'left' | 'right',
  ): { x: number; y: number } => {
    const center = calculateSeatCenter(groupConfig, index)
    const offset = OFFSET_CONFIGS[tableId]?.[side]?.tooltip || { x: 0, y: 0 }

    return {
      x: center.x + offset.x,
      y: center.y + offset.y,
    }
  }

  /**
   * 生成勾选标记的SVG路径
   */
  const generateCheckmarkPath = (cx: number, cy: number): string => {
    return `M ${cx - 2} ${cy} L ${cx - 0.5} ${cy + 1.5} L ${cx + 2} ${cy - 1.5}`
  }

  // 生成标准半圆形座位的SVG路径
  const generateSemicirclePath = (
    x: number,
    y: number,
    width: number,
    height: number,
    isLeft: boolean,
  ): string => {
    const radius = height / 2
    if (isLeft) {
      // 左侧半圆：左边是圆弧，右边是直线
      return `M ${x} ${y} h ${width} v ${height} h -${width} a ${radius} ${radius} 0 0 1 0 -${height} z`
    } else {
      // 右侧半圆：右边是圆弧，左边是直线
      return `M ${x} ${y} h ${width} a ${radius} ${radius} 0 0 1 0 ${height} h -${width} z`
    }
  }

  // 生成座位SVG路径
  const generateSeatPath = (groupConfig: SeatGroupConfig, index: number): string => {
    const x = calculateSeatX(groupConfig)
    const y = calculateSeatY(groupConfig, index)
    const { width, height, shape } = groupConfig

    switch (shape) {
      case 'semicircle-left':
        return generateSemicirclePath(x, y, width, height, true)
      case 'semicircle-right':
        return generateSemicirclePath(x, y, width, height, false)
      case 'custom-svg':
        // 自定义SVG使用配置中的svgPath
        return groupConfig.svgPath || ''
      default:
        return ''
    }
  }

  // 计算自定义SVG座位的transform属性
  const calculateCustomSeatTransform = (groupConfig: SeatGroupConfig, index: number): string => {
    const x = calculateSeatX(groupConfig)
    const y = calculateSeatY(groupConfig, index)
    const scale = groupConfig.scale || 1

    if (groupConfig.mirror) {
      // 镜像：scale的X轴为负
      return `translate(${x}, ${y}) scale(${scale}, ${Math.abs(scale)})`
    } else {
      return `translate(${x}, ${y}) scale(${Math.abs(scale)})`
    }
  }

  // ========== 向后兼容的旧接口 ==========

  /**
   * @deprecated 使用 calculateCheckmarkPosition 替代
   */
  const calculateCheckmarkPositionOld = (
    groupConfig: SeatGroupConfig,
    index: number,
  ): { cx: number; cy: number } => {
    const x = calculateSeatX(groupConfig)
    const y = calculateSeatY(groupConfig, index)
    const { width, height, shape } = groupConfig

    if (shape === 'custom-svg') {
      const centerX = x + (groupConfig.width || 17) / 2
      const centerY = y + (groupConfig.height || 19) / 2
      return { cx: centerX, cy: centerY }
    } else {
      const centerX = x + width / 2
      const centerY = y + height / 2
      return { cx: centerX, cy: centerY }
    }
  }

  return {
    config,
    viewport,
    colors,
    tables,
    getTableById,
    getSeatGroupConfig,
    calculateSeatY,
    calculateSeatX,
    generateSeatPath,
    calculateCustomSeatTransform,
    calculateSeatCenter,
    calculateCheckmarkPosition,
    calculateUserIconPosition,
    calculateTooltipPosition,
    generateCheckmarkPath,
    // 向后兼容：旧版本接口（不推荐使用）
    calculateCheckmarkPositionOld,
  }
}
