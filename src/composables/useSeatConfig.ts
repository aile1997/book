/**
 * 座位配置加载器
 * 用于加载和管理座位布局配置
 */

import { ref, computed } from 'vue'
import type { SeatLayoutConfig, TableConfig, SeatGroupConfig } from '../types/seatConfig'
import seatLayoutConfig from '../config/seatLayout.json'

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

  // 计算选中标记的位置（白色圆圈和勾选标记）
  const calculateCheckmarkPosition = (
    groupConfig: SeatGroupConfig,
    index: number,
  ): { cx: number; cy: number } => {
    const x = calculateSeatX(groupConfig)
    const y = calculateSeatY(groupConfig, index)
    const { width, height, shape } = groupConfig

    if (shape === 'custom-svg') {
      // 自定义SVG座位的勾选标记位置
      const centerX = x + (groupConfig.width || 17) / 2
      const centerY = y + (groupConfig.height || 19) / 2
      return { cx: centerX, cy: centerY }
    } else {
      // 标准半圆形座位的勾选标记位置
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
    calculateCheckmarkPosition,
  }
}
