/**
 * 座位布局配置类型定义
 * 用于定义座位地图的所有配置参数，消除魔法数字
 */

// 座位形状类型
export type SeatShape = 'semicircle-left' | 'semicircle-right' | 'custom-svg'

// 视口配置
export interface ViewportConfig {
  width: number // SVG viewBox 宽度
  height: number // SVG viewBox 高度
  aspectRatio: string // 容器纵横比（如 "165%"）
}

// 颜色配置
export interface ColorConfig {
  available: string // 可用座位颜色
  occupied: string // 已占用座位颜色
  selected: string // 选中座位颜色
  table: string // 桌子颜色
  label: string // 标注文字颜色
}

// 座位组配置（左侧或右侧）
export interface SeatGroupConfig {
  count: number // 座位数量
  startX: number // 起始X坐标
  startY: number // 起始Y坐标
  spacing: number // 座位间距
  width: number // 座位宽度
  height: number // 座位高度
  shape: SeatShape // 座位形状
  scale?: number // 缩放比例（用于自定义SVG）
  mirror?: boolean // 是否镜像（用于自定义SVG）
  svgPath?: string // 自定义SVG路径
}

// 桌子位置配置
export interface TablePositionConfig {
  x: number // 桌子X坐标
  y: number // 桌子Y坐标
  width: number // 桌子宽度
  height: number // 桌子高度
}

// 桌子配置
export interface TableConfig {
  id: string // 桌子ID（A/B/C）
  label: string // 桌子标注文字
  type: 'standard' | 'special' // 桌子类型
  position: TablePositionConfig // 桌子位置
  seats: {
    left: SeatGroupConfig // 左侧座位组
    right: SeatGroupConfig // 右侧座位组
  }
}

// 装饰标签配置
export interface LabelConfig {
  text: string // 标签文字
  x: number // X坐标
  y: number // Y坐标
  fontSize: number // 字体大小
  color: string // 文字颜色
}

// 装饰元素配置
export interface DecorationConfig {
  labels: LabelConfig[] // 标签列表
}

// 完整的座位布局配置
export interface SeatLayoutConfig {
  viewport: ViewportConfig // 视口配置
  colors: ColorConfig // 颜色配置
  tables: TableConfig[] // 桌子配置列表
  decorations?: DecorationConfig // 装饰元素配置（可选）
}
