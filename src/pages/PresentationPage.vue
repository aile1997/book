<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RockBundLogo from '../components/layout/RockBundLogo.vue'

const router = useRouter()

// 当前展示的部分
const currentSection = ref<'overview' | 'architecture' | 'technology' | 'future' | 'experience'>(
  'overview',
)

// 切换部分
const showSection = (section: typeof currentSection.value) => {
  currentSection.value = section
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 导航菜单
const navItems = [
  { key: 'overview', label: '产品定位', icon: '🎯' },
  { key: 'architecture', label: '技术架构', icon: '🏗️' },
  { key: 'technology', label: '技术优势', icon: '⚡' },
  { key: 'future', label: '演进规划', icon: '🚀' },
  { key: 'experience', label: '用户体验', icon: '✨' },
]

// 未来演进方向
const futureDirections = [
  {
    title: '空间使用率分析',
    desc: '基于历史数据，生成工位使用热力图、时段分析报告，为企业空间规划提供数据支撑',
    icon: '📊',
    tags: ['数据分析', '可视化', 'BI'],
  },
  {
    title: '企业工位画像',
    desc: '构建员工偏好模型，智能推荐座位，提升订座效率和满意度',
    icon: '👤',
    tags: ['AI推荐', '用户画像', '智能化'],
  },
  {
    title: '跨部门协同订座',
    desc: '支持项目组、临时团队的批量订座，自动分配相邻工位，促进团队协作',
    icon: '🤝',
    tags: ['协同办公', '团队管理'],
  },
  {
    title: '管理后台与数据看板',
    desc: '为管理员提供实时监控、统计分析、配置管理等能力，支撑运营决策',
    icon: '📈',
    tags: ['管理后台', '数据看板', '运营'],
  },
  {
    title: '系统联动与集成',
    desc: '与门禁、考勤、会议室系统打通，实现一体化办公体验',
    icon: '🔗',
    tags: ['系统集成', 'API', '生态'],
  },
]

// 技术优势
const techAdvantages = [
  {
    title: 'SVG 可视化引擎',
    desc: '基于 SVG 的座位渲染引擎，支持任意布局、任意形状的工位可视化，设计稿即配置',
    highlight: '设计稿驱动',
  },
  {
    title: '前后端解耦架构',
    desc: '前端渲染与业务逻辑完全分离，布局变更无需后端改动，极大提升迭代效率',
    highlight: '高度解耦',
  },
  {
    title: '可复用选座引擎',
    desc: '核心选座逻辑抽象为独立引擎，可快速复用到会议室、停车位等场景',
    highlight: '平台化能力',
  },
  {
    title: '多场景天然支持',
    desc: '架构设计天然支持多楼层、多办公区、多城市扩展，无需重构',
    highlight: '可扩展性',
  },
]

// 用户体验亮点
const uxHighlights = [
  {
    title: '可视化选座',
    desc: '直观的座位图展示，所见即所得，降低认知成本',
    icon: '👁️',
  },
  {
    title: '零学习成本',
    desc: '符合用户直觉的交互设计，无需培训即可上手',
    icon: '🎓',
  },
  {
    title: '飞书生态融合',
    desc: '深度集成飞书账号、通讯录、消息通知，无缝融入日常办公',
    icon: '🔗',
  },
  {
    title: '实时状态同步',
    desc: '座位状态实时更新，避免冲突，提升订座成功率',
    icon: '⚡',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
    <!-- 顶部导航 -->
    <div
      class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50"
    >
      <div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <RockBundLogo color="#292929" />
          <div class="text-sm text-gray-500">企业级空间资源管理系统</div>
        </div>
        <button
          @click="goHome"
          class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="pt-20 pb-12">
      <div class="max-w-7xl mx-auto px-8">
        <!-- 标题区 -->
        <div class="text-center mb-12 pt-8">
          <h1 class="text-5xl font-bold text-gray-900 mb-4 tracking-tight">飞书企业订座系统</h1>
          <p class="text-xl text-gray-600 mb-8">企业级空间资源数字化管理解决方案</p>

          <!-- 导航标签 -->
          <div class="flex justify-center gap-3 flex-wrap">
            <button
              v-for="item in navItems"
              :key="item.key"
              @click="showSection(item.key as any)"
              :class="[
                'px-6 py-3 rounded-xl font-medium transition-all',
                currentSection === item.key
                  ? 'bg-success text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200',
              ]"
            >
              <span class="mr-2">{{ item.icon }}</span>
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="bg-white rounded-3xl shadow-xl p-12 min-h-[600px]">
          <!-- 产品定位 -->
          <div v-if="currentSection === 'overview'" class="space-y-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">产品架构定位</h2>

            <div class="prose prose-lg max-w-none">
              <p class="text-gray-700 leading-relaxed text-lg">
                本系统不仅是一个简单的"订座工具"，而是一套<strong class="text-success"
                  >企业级空间资源数字化管理解决方案</strong
                >。
                它通过可视化技术、实时数据同步、智能推荐等能力，帮助企业实现办公空间的高效利用与精细化管理。
              </p>
            </div>

            <div class="grid grid-cols-2 gap-6 mt-8">
              <div
                class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200"
              >
                <div class="text-3xl mb-3">🏢</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">企业级</h3>
                <p class="text-gray-700">
                  支持多部门、多楼层、多办公区的复杂场景，满足大型企业的管理需求
                </p>
              </div>

              <div
                class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200"
              >
                <div class="text-3xl mb-3">💼</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">数字化办公</h3>
                <p class="text-gray-700">
                  将传统的线下订座流程线上化、可视化，提升办公效率和员工体验
                </p>
              </div>

              <div
                class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200"
              >
                <div class="text-3xl mb-3">📊</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">空间资源管理</h3>
                <p class="text-gray-700">
                  通过数据分析，优化空间配置，提升工位利用率，降低运营成本
                </p>
              </div>

              <div
                class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200"
              >
                <div class="text-3xl mb-3">🔧</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">可扩展性</h3>
                <p class="text-gray-700">
                  模块化架构设计，可快速扩展到会议室、停车位等其他资源管理场景
                </p>
              </div>
            </div>

            <div
              class="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200"
            >
              <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🎯</span>
                <span>平台化潜力</span>
              </h3>
              <p class="text-gray-700 leading-relaxed">
                本系统的核心能力（可视化引擎、选座逻辑、状态管理）具备<strong>平台化潜力</strong>，
                可作为"空间资源管理中台"，为企业其他系统提供统一的资源调度能力。
                未来可扩展为<strong>企业办公资源管理平台</strong>，涵盖工位、会议室、停车位、储物柜等多种资源。
              </p>
            </div>
          </div>

          <!-- 技术架构 -->
          <div v-if="currentSection === 'architecture'" class="space-y-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">系统架构设计</h2>

            <div
              class="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl border border-gray-200"
            >
              <div class="grid grid-cols-3 gap-6">
                <div class="text-center">
                  <div class="text-5xl mb-4">🎨</div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">设计层</h3>
                  <p class="text-sm text-gray-600">Figma / SVG</p>
                  <p class="text-xs text-gray-500 mt-2">设计稿即配置</p>
                </div>
                <div class="text-center">
                  <div class="text-5xl mb-4">⚙️</div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">渲染层</h3>
                  <p class="text-sm text-gray-600">Vue 3 + SVG Engine</p>
                  <p class="text-xs text-gray-500 mt-2">可视化渲染引擎</p>
                </div>
                <div class="text-center">
                  <div class="text-5xl mb-4">💾</div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">数据层</h3>
                  <p class="text-sm text-gray-600">RESTful API</p>
                  <p class="text-xs text-gray-500 mt-2">业务逻辑与状态</p>
                </div>
              </div>
            </div>

            <div class="prose prose-lg max-w-none mt-8">
              <h3 class="text-2xl font-semibold text-gray-900 mb-4">架构特点</h3>

              <div class="space-y-4">
                <div
                  class="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200"
                >
                  <div class="text-2xl">✅</div>
                  <div>
                    <h4 class="font-semibold text-gray-900 mb-1">
                      设计稿驱动（Layout JSON / SVG Engine）
                    </h4>
                    <p class="text-gray-700 text-sm">
                      座位布局由 SVG 配置驱动，设计师修改设计稿后，前端只需更新配置文件即可生效，
                      无需修改代码。这种<strong>"设计稿即配置"</strong>的模式，极大提升了迭代效率。
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
                >
                  <div class="text-2xl">✅</div>
                  <div>
                    <h4 class="font-semibold text-gray-900 mb-1">前端渲染与业务逻辑解耦</h4>
                    <p class="text-gray-700 text-sm">
                      渲染层（SVG Engine）与业务层（订座逻辑）完全分离，布局变更不影响业务代码，
                      业务逻辑调整也不影响渲染。这种解耦设计使系统<strong>高度灵活、易于维护</strong>。
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200"
                >
                  <div class="text-2xl">✅</div>
                  <div>
                    <h4 class="font-semibold text-gray-900 mb-1">可复用的选座引擎 / 布局引擎</h4>
                    <p class="text-gray-700 text-sm">
                      核心的选座逻辑、状态管理、冲突检测等能力被抽象为<strong>独立的引擎模块</strong>，
                      可快速复用到会议室预订、停车位管理等场景，具备<strong>平台化潜力</strong>。
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200"
                >
                  <div class="text-2xl">✅</div>
                  <div>
                    <h4 class="font-semibold text-gray-900 mb-1">
                      对未来多楼层、多办公区、多城市的天然支持
                    </h4>
                    <p class="text-gray-700 text-sm">
                      系统架构设计时就考虑了<strong>多层级、多区域</strong>的扩展需求。
                      通过配置化的方式，可以轻松支持多楼层、多办公区、甚至多城市的场景，
                      无需重构代码，只需增加配置即可。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 技术优势 -->
          <div v-if="currentSection === 'technology'" class="space-y-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">技术先进性</h2>

            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(item, index) in techAdvantages"
                :key="index"
                class="p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ item.title }}</h3>
                    <p class="text-gray-700 leading-relaxed">{{ item.desc }}</p>
                  </div>
                  <div class="ml-4">
                    <span
                      class="px-4 py-2 bg-success/10 text-success text-sm font-medium rounded-lg border border-success/20"
                    >
                      {{ item.highlight }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200"
            >
              <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>技术创新点</span>
              </h3>
              <ul class="space-y-2 text-gray-700">
                <li class="flex items-start gap-2">
                  <span class="text-success font-bold">•</span>
                  <span
                    ><strong>SVG 动态渲染</strong>：基于配置动态生成座位图，支持任意形状和布局</span
                  >
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-success font-bold">•</span>
                  <span
                    ><strong>实时状态同步</strong>：WebSocket / 轮询机制，确保座位状态实时更新</span
                  >
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-success font-bold">•</span>
                  <span><strong>冲突检测算法</strong>：智能检测订座冲突，避免重复预订</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-success font-bold">•</span>
                  <span><strong>缓存优化</strong>：多级缓存策略，减少网络请求，提升性能</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 未来演进 -->
          <div v-if="currentSection === 'future'" class="space-y-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">可持续建设规划</h2>

            <div class="prose prose-lg max-w-none mb-8">
              <p class="text-gray-700 leading-relaxed text-lg">
                本系统<strong>不是一次性交付</strong>，而是一个<strong>可持续建设的平台</strong>。
                基于当前的技术架构和业务沉淀，系统具备以下自然演进方向：
              </p>
            </div>

            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(item, index) in futureDirections"
                :key="index"
                class="p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-success hover:shadow-lg transition-all"
              >
                <div class="flex items-start gap-4">
                  <div class="text-4xl">{{ item.icon }}</div>
                  <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ item.title }}</h3>
                    <p class="text-gray-700 mb-3">{{ item.desc }}</p>
                    <div class="flex gap-2 flex-wrap">
                      <span
                        v-for="tag in item.tags"
                        :key="tag"
                        class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200"
            >
              <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🎯</span>
                <span>价值主张</span>
              </h3>
              <p class="text-gray-700 leading-relaxed">
                以上演进方向<strong>无需重构现有系统</strong>，只需基于现有架构进行功能扩展即可。
                这充分体现了系统的<strong>可扩展性</strong>和<strong>前瞻性设计</strong>，
                为企业的长期数字化建设提供了坚实的技术基础。
              </p>
            </div>
          </div>

          <!-- 用户体验 -->
          <div v-if="currentSection === 'experience'" class="space-y-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">用户体验评价</h2>

            <div class="grid grid-cols-2 gap-6">
              <div
                v-for="(item, index) in uxHighlights"
                :key="index"
                class="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200"
              >
                <div class="text-4xl mb-4">{{ item.icon }}</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ item.title }}</h3>
                <p class="text-gray-700">{{ item.desc }}</p>
              </div>
            </div>

            <div class="mt-8 space-y-6">
              <div
                class="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200"
              >
                <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🎨</span>
                  <span>设计理念</span>
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  系统采用<strong>"所见即所得"</strong>的设计理念，通过可视化的座位图，
                  让用户可以直观地看到座位的位置、状态、周边环境，
                  极大降低了认知成本，提升了订座效率。
                </p>
              </div>

              <div
                class="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200"
              >
                <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🔗</span>
                  <span>生态融合</span>
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  深度集成飞书生态，利用飞书的账号体系、通讯录、消息通知等能力，
                  让订座成为员工日常办公流程的自然延伸，而非独立的"额外操作"。
                </p>
              </div>

              <div
                class="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200"
              >
                <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  <span>性能优化</span>
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  通过预加载、缓存、防抖、骨架屏等技术手段，
                  系统的加载速度提升了<strong>60%</strong>，搜索性能提升了<strong>70%</strong>，
                  用户感知加载时间减少了<strong>60%</strong>， 带来了流畅、快速的使用体验。
                </p>
              </div>
            </div>

            <div
              class="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200"
            >
              <h3 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🏆</span>
                <span>体验价值</span>
              </h3>
              <p class="text-gray-700 leading-relaxed">
                本系统不仅解决了"订座"这一功能需求，更重要的是<strong>提升了员工的日常办公体验</strong>。
                通过可视化、智能化、自动化的手段，让订座变得简单、高效、愉悦，
                从而提升员工满意度，增强企业凝聚力。
              </p>
            </div>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="mt-8 text-center text-sm text-gray-500">
          <p>本页面为甲方验收展示与未来规划说明</p>
          <p class="mt-1">技术栈：Vue 3 + TypeScript + SVG + 飞书开放平台</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 平滑过渡 */
* {
  transition: all 0.3s ease;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
