<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBooking } from '../composables/useBooking' // 导入 useBooking
import { useAuth } from '../composables/useAuth' // 导入 useAuth 检查登录状态
import { useRouter } from 'vue-router'
import { useSeats } from '../composables/useSeats'
import { checkUserExists } from '../api'
import { useToast } from '../composables/useToast'
import SeatMap from '../components/features/SeatMap.vue'
import InvitePartnerModal from '../components/modals/InvitePartnerModal.vue'
import FindPartnerModal from '../components/modals/FindPartnerModal.vue'
import SeatSelectionModal from '../components/modals/SeatSelectionModal.vue'
import SuccessModal from '../components/modals/SuccessModal.vue'
import ConfirmModal from '../components/modals/ConfirmModal.vue'
import type { TimeSlot, Partner } from '../types/booking'

const router = useRouter()
const { error: showError } = useToast()
const { isAuthenticated } = useAuth()
const { makeBooking, removeBooking } = useBooking()
const {
  seats,
  isLoading: isLoadingSeats,
  selectedSeat,
  selectedDateTime,
  seatAvailability,
  myBookingInCurrentSlot,
  fetchSeats,
  clearSelection,
} = useSeats()

// 邀请的伙伴列表
const invitedPartners = ref<Partner[]>([])

// 模态框状态
const showSeatModal = ref(false)
const showFindPartnerModal = ref(false)
const showSuccessModal = ref(false)
const showConfirmModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  onConfirm: () => {}
})

// 高亮显示的伙伴（用于在座位图上显示tooltip）
const highlightedPartner = ref<{ name: string; seat: string } | null>(null)

// 计算当前预订所需的积分
const coinCost = computed(() => {
  // 基础积分 10，每邀请一个伙伴增加 10
  return 10 + invitedPartners.value.length * 10
})

// 处理邀请伙伴
const handleInvitePartner = (partner: Partner) => {
  if (invitedPartners.value.length >= 3) {
    showError('最多只能邀请 3 位伙伴')
    return
  }
  if (invitedPartners.value.some((p) => p.id === partner.id)) {
    showError('该伙伴已在邀请列表中')
    return
  }
  invitedPartners.value.push(partner)
}

// 移除已邀请的伙伴
const removePartner = (partnerId: string) => {
  invitedPartners.value = invitedPartners.value.filter((p) => p.id !== partnerId)
}

// 确认伙伴邀请（从 SeatSelectionModal 返回）
const confirmPartnerInvite = (partners: Partner[]) => {
  invitedPartners.value = partners
}

/**
 * 自动分配邻近座位逻辑
 * @param centerSeatId 中心座位 ID
 * @param partnersCount 伙伴数量
 */
function assignNearbySeats(centerSeatId: string, partnersCount: number): string[] {
  if (partnersCount === 0) return []

  const centerSeat = seats.value.find((s) => s.id === centerSeatId)
  if (!centerSeat) return []

  // 简单的邻近算法：查找同区域、同排且未被占用的座位
  const availableSeats = seats.value.filter((s) => {
    // 排除中心座位
    if (s.id === centerSeatId) return false
    // 必须是可选状态
    const availability = seatAvailability.value.find((a) => a.seatId === s.backendSeatId)
    if (!availability?.isAvailable) return false
    // 排除已被其他伙伴选中的座位（在实际分配过程中处理）
    return true
  })

  // 按距离排序（这里简化为按 ID 差异排序，实际可根据坐标计算）
  return availableSeats
    .sort((a, b) => {
      const distA = Math.abs(parseInt(a.id.slice(1)) - parseInt(centerSeat.id.slice(1)))
      const distB = Math.abs(parseInt(b.id.slice(1)) - parseInt(centerSeat.id.slice(1)))
      return distA - distB
    })
    .slice(0, partnersCount)
    .map((s) => s.id)
}

/**
 * 预订执行核心逻辑
 * 涵盖四种场景：切换座位、直接邀请好友、正常选座、正常选座邀请
 */
const bookNow = async () => {
  // 基础校验：登录状态与时间段选择
  if (!isAuthenticated.value) return showError('请先登录才能进行预订操作')
  if (!selectedDateTime.value) return showError('请先选择预订时间段')

  // 1. 确定目标座位
  // 场景 1, 3, 4：使用新选中的座位 (selectedSeat)
  // 场景 2：若未选新座但已有预订，则使用旧座位 (myBookingInCurrentSlot) 进行直接邀请
  const targetSeat = selectedSeat.value 
    ? seats.value.find(s => s.id === selectedSeat.value)
    : myBookingInCurrentSlot.value

  if (!targetSeat?.backendSeatId) return showError('请先选择有效的座位')

  // 2. 伙伴预订状态校验（调用新接口）
  if (invitedPartners.value.length > 0) {
    try {
      const checkPromises = invitedPartners.value.map(partner => 
        checkUserExists(partner.id).then(res => ({
          partner,
          exists: res.exists || res.hasBooking // 兼容可能的返回字段名
        }))
      )
      const results = await Promise.all(checkPromises)
      const partnersWithBooking = results.filter(r => r.exists).map(r => r.partner)

      if (partnersWithBooking.length > 0) {
        const names = partnersWithBooking.map(p => p.fullName).join(', ')
        return showError(`伙伴 ${names} 在该时间段已有预订，无法重复邀请`)
      }
    } catch (err) {
      console.error('校验伙伴状态失败:', err)
      // 如果接口报错，可以选择继续或提示错误
    }
  }

  // 3. 准备预订数据与邻座分配
  // 根据目标座位自动为伙伴分配最近的空闲邻座
  const partnerAllocations = assignNearbySeats(targetSeat.id, invitedPartners.value.length)
  const invitePartners = invitedPartners.value
    .map((partner, index) => {
      const assignedSeat = seats.value.find(s => s.id === partnerAllocations[index])
      return assignedSeat?.backendSeatId ? {
        userId: partner.id,
        openId: partner.openId || '',
        username: partner.username || partner.fullName,
        seatId: assignedSeat.backendSeatId,
      } : null
    })
    .filter(p => p !== null)

  const bookingData = {
    seatId: targetSeat.backendSeatId,
    bookingDate: selectedDateTime.value.dateISO,
    timeSlotId: Number(selectedDateTime.value.timeSlotId),
    invitePartners
  }

  /**
   * 内部执行函数：处理取消旧预订并创建新预订的原子操作
   */
  const executeBooking = async () => {
    try {
      // 如果当前时间段已有预订，必须先调用取消接口（后端 makeBooking 不支持直接覆盖）
      if (myBookingInCurrentSlot.value) {
        const oldBookingId = (myBookingInCurrentSlot.value as any).bookingId
        if (oldBookingId) {
          await removeBooking(oldBookingId)
        }
      }
      
      // 执行预订请求
      await makeBooking(bookingData)
      
      // 预订成功后的 UI 反馈与状态重置
      showSuccessModal.value = true
      await refreshData() // 刷新座位图可用性
      clearSelection()    // 清除当前选座状态
      invitedPartners.value = [] // 清空邀请列表
    } catch (error: any) {
      showError(error.message || '预订失败，请稍后重试')
    }
  }

  // 4. 场景判断与弹窗交互
  if (myBookingInCurrentSlot.value) {
    // 已有预订的情况：区分“切换座位”与“直接邀请”
    const isChangingSeat = !!selectedSeat.value
    
    confirmModalConfig.value = {
      title: isChangingSeat ? '确认切换座位' : '确认邀请伙伴',
      message: isChangingSeat 
        ? '您在该时间段已有预订，是否取消原预订并切换到新座位？' 
        : '您在该时间段已有预订，是否取消原预订并重新发起包含伙伴的预订？',
      onConfirm: executeBooking
    }
    showConfirmModal.value = true
  } else {
    // 场景 3 & 4：无预订情况下的正常流程，无需二次确认
    await executeBooking()
  }
}

// 数据刷新封装
async function refreshData() {
  if (selectedDateTime.value) {
    await fetchSeats(
      selectedDateTime.value.dateISO,
      Number(selectedDateTime.value.timeSlotId),
      1 // 默认区域 ID
    )
  }
}

onMounted(async () => {
  // 初始化加载数据
  await refreshData()
})
</script>

<template>
  <div class="BookingPage min-h-screen bg-white pb-32">
    <!-- ========== Header ========== -->
    <header class="px-6 pt-8 pb-4 flex items-center justify-between">
      <button @click="router.back()" class="p-2 -ml-2">
        <img src="@/assets/images/home/Back.png" alt="Back" class="w-6 h-6" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Booking</h1>
      <div class="w-10"></div>
      <!-- Placeholder for balance -->
    </header>

    <!-- ========== Seat Map Section ========== -->
    <section class="px-6 mt-4">
      <div class="bg-gray-50 rounded-[32px] p-6 min-h-[400px] relative overflow-hidden">
        <div v-if="isLoadingSeats" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        
        <SeatMap 
          :seats="seats" 
          :availability="seatAvailability"
          v-model:selected-seat="selectedSeat"
          @highlight-partner="highlightedPartner = $event"
        />

        <!-- Partner Tooltip -->
        <div 
          v-if="highlightedPartner"
          class="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 animate-fade-in"
        >
          <div class="w-2 h-2 rounded-full bg-primary"></div>
          <span class="text-sm font-medium text-gray-700">{{ highlightedPartner.name }}'s Seat</span>
        </div>
      </div>
    </section>

    <!-- ========== Booking Summary ========== -->
    <section class="px-8 mt-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">
          {{ selectedSeat ? 'Booking Summary' : (myBookingInCurrentSlot ? 'Current Booking' : 'Booking Summary') }}
        </h2>
        <button 
          v-if="!selectedSeat && !myBookingInCurrentSlot"
          @click="showSeatModal = true"
          class="text-primary font-bold text-sm flex items-center gap-1"
        >
          Select Seat
          <img src="@/assets/images/home/ArrowRight.png" alt="" class="w-4 h-4" />
        </button>
        <button 
          v-else
          @click="showSeatModal = true"
          class="text-primary font-bold text-sm"
        >
          Change Seat
        </button>
      </div>

      <!-- Selected Seat Info -->
      <div v-if="selectedSeat || myBookingInCurrentSlot" class="space-y-4">
        <div class="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <img src="@/assets/images/home/SeatIcon.png" alt="" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Selected Seat</p>
              <p class="text-lg font-bold text-gray-900">
                {{ selectedSeat ? seats.find(s => s.id === selectedSeat)?.id : (myBookingInCurrentSlot as any)?.id }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Time Slot</p>
            <p class="text-sm font-bold text-gray-900">{{ selectedDateTime?.timeSlotName }}</p>
          </div>
        </div>

        <!-- Invited Partners -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <p class="text-sm font-bold text-gray-900">Partners ({{ invitedPartners.length }}/3)</p>
            <button 
              @click="showFindPartnerModal = true"
              class="text-primary text-xs font-bold"
            >
              + Add Partner
            </button>
          </div>
          
          <div v-if="invitedPartners.length === 0" class="p-4 border-2 border-dashed border-gray-100 rounded-2xl text-center">
            <p class="text-xs text-gray-400">No partners invited yet</p>
          </div>
          
          <div v-else class="grid grid-cols-1 gap-2">
            <div 
              v-for="partner in invitedPartners" 
              :key="partner.id"
              class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                  {{ partner.fullName.charAt(0) }}
                </div>
                <span class="text-sm font-medium text-gray-700">{{ partner.fullName }}</span>
              </div>
              <button @click="removePartner(partner.id)" class="p-1">
                <img src="@/assets/images/home/Close.png" alt="Remove" class="w-4 h-4 opacity-40" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
        <img src="@/assets/images/home/EmptySeat.png" alt="" class="w-20 h-20 opacity-20 mb-4" />
        <p class="text-gray-400 text-sm font-medium">Please select a seat to continue</p>
      </div>
    </section>

    <!-- ========== Fixed Bottom Action Bar ========== -->
    <div class="fixed bottom-0 left-0 right-0 bg-white px-6 py-4 z-20 shadow-lg">
      <div class="flex justify-end max-w-2xl mx-auto">
        <div class="flex items-center gap-3 w-2/3">
          <div class="flex items-center gap-1.5 px-3 py-2 bg-cyan/10 rounded-xl flex-shrink-0">
            <img src="@/assets/images/home/Vector.png" alt="" class="w-5 h-5" />
            <span class="text-base font-bold text-cyan">{{ coinCost }}</span>
          </div>

          <button
            @click="bookNow"
            :disabled="(!selectedSeat && !myBookingInCurrentSlot) || isBookingLoading || isLoadingSeats"
            class="w-full py-4 text-lg font-bold text-white rounded-xl bg-[#2C2C2C] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {{ isBookingLoading ? 'Processing...' : 'Book Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 模态框组件 ========== -->

    <!-- 座位选择模态框 -->
    <SeatSelectionModal
      v-model:visible="showSeatModal"
      :seats="seats"
      v-model:selected-seat="selectedSeat"
      v-model:selected-partners="invitedPartners"
      @confirm="confirmPartnerInvite"
    />

    <!-- 查找伙伴模态框 -->
    <FindPartnerModal
      v-model:visible="showFindPartnerModal"
      @select="handleInvitePartner"
    />

    <!-- 成功模态框 -->
    <SuccessModal v-model:visible="showSuccessModal" />

    <!-- 确认模态框 -->
    <ConfirmModal
      v-model:visible="showConfirmModal"
      :title="confirmModalConfig.title"
      :message="confirmModalConfig.message"
      @confirm="confirmModalConfig.onConfirm"
    />
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 10px;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
