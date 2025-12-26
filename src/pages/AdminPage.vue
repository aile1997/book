
<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">管理员界面</h1>

    <section class="mb-8 p-4 border rounded-lg shadow-sm">
      <h2 class="text-xl font-semibold mb-4">区域管理</h2>
      <div v-if="isLoadingAreas">正在加载区域列表...</div>
      <div v-else-if="areas.length > 0" class="space-y-2">
        <div v-for="area in areas" :key="area.id" class="flex items-center justify-between p-2 border rounded">
          <span>{{ area.nameZh }} ({{ area.name }}) - ID: {{ area.id }}</span>
          <div class="space-x-2">
            <button @click="handleDeleteAllSeats(area.id, area.nameZh)" class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">清空座位</button>
            <button @click="handleDeleteArea(area.id)" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">删除区域</button>
          </div>
        </div>
      </div>
      <div v-else>暂无区域数据。</div>
    </section>

    <section class="mb-8 p-4 border rounded-lg shadow-sm">
      <h2 class="text-xl font-semibold mb-4">创建新区域 (用于初始化)</h2>
      <button
        @click="createAreas"
        :disabled="isCreatingAreas"
        class="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
      >
        {{ isCreatingAreas ? '创建中...' : '创建 nsd 区域' }}
      </button>
      <div v-if="areaCreationStatus.length" class="mt-4 space-y-2">
        <div v-for="status in areaCreationStatus" :key="status.name" :class="status.success ? 'text-green-600' : 'text-red-600'">
          {{ status.name }}: {{ status.message }}
        </div>
      </div>
      <div v-if="areaIdMap" class="mt-4">
        <h3 class="font-medium">区域 ID 映射:</h3>
        <pre class="bg-gray-100 p-2 rounded text-sm">{{ areaIdMap }}</pre>
      </div>
    </section>

    <section class="mb-8 p-4 border rounded-lg shadow-sm">
      <h2 class="text-xl font-semibold mb-4">2. 批量创建座位</h2>
      <button
        @click="batchCreateSeats"
        :disabled="!areaIdMap || isCreatingSeats"
        class="w-full py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
      >
        {{ isCreatingSeats ? '创建中...' : '批量创建座位' }}
      </button>
      <div v-if="seatCreationMessage" class="mt-4" :class="seatCreationSuccess ? 'text-green-600' : 'text-red-600'">
        {{ seatCreationMessage }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createArea, batchCreateSeats as apiBatchCreateSeats, getAreas, deleteArea, deleteSeat, getSeatMap } from '../api';
import { convertFrontendConfigToBackendAreas, convertFrontendConfigToBackendSeats } from '../utils/dataAdapter';

// 状态
const isCreatingAreas = ref(false);
const areaCreationStatus = ref<{ name: string; success: boolean; message: string }[]>([]);
const areaIdMap = ref<{ [key: string]: number } | null>(null);

const isCreatingSeats = ref(false);
const seatCreationMessage = ref('');
const seatCreationSuccess = ref(false);

const areas = ref<any[]>([]);
const isLoadingAreas = ref(false);

async function loadAreas() {
  isLoadingAreas.value = true;
  try {
    const response = await getAreas();
    areas.value = response || [];
  } catch (error) {
    console.error('加载区域列表失败:', error);
    areas.value = [];
  } finally {
    isLoadingAreas.value = false;
  }
}

async function handleDeleteArea(areaId: number) {
  if (confirm('确定要删除这个区域吗？删除后，该区域下的所有座位和预订信息都将丢失。')) {
    try {
      await deleteArea(areaId);
      alert('区域删除成功！');
      loadAreas(); // 重新加载列表
    } catch (error: any) {
      const message = error.message || (error.data && error.data.message) || '未知错误';
      alert(`删除失败: ${message}`);
    }
  }
}

async function handleDeleteAllSeats(areaId: number, areaName: string) {
  if (!confirm(`确定要删除 ${areaName} 区域下的所有座位吗？此操作不可逆。`)) {
    return;
  }

  try {
    // 1. 获取该区域的所有座位数据
    const mapData = await getSeatMap(areaId);
    const area = mapData.areas.find((a: any) => a.id === areaId);

    if (!area || !area.seats || area.seats.length === 0) {
      alert(`${areaName} 区域下没有座位需要删除。`);
      return;
    }

    const seatIds = area.seats.map((seat: any) => seat.seatId);
    let successCount = 0;
    let failCount = 0;

    // 2. 循环调用单个删除 API
    for (const seatId of seatIds) {
      try {
        await deleteSeat(seatId);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`删除座位 ID ${seatId} 失败:`, error);
      }
    }

    if (failCount === 0) {
      alert(`成功删除 ${areaName} 区域下的 ${successCount} 个座位！`);
    } else {
      alert(`删除完成。成功 ${successCount} 个，失败 ${failCount} 个。请检查控制台了解详情。`);
    }
    
    // 重新加载区域列表，虽然座位删除不影响区域列表，但可以确保状态最新
    loadAreas(); 

  } catch (error: any) {
    const message = error.message || (error.data && error.data.message) || '未知错误';
    alert(`清空座位失败: ${message}`);
    console.error('清空座位失败:', error);
  }
}

onMounted(() => {
  loadAreas();
});

/**
 * 创建区域 A, B, C
 */
async function createAreas() {
  isCreatingAreas.value = true;
  areaCreationStatus.value = [];
  areaIdMap.value = {};

  const areasToCreate = convertFrontendConfigToBackendAreas();
  const map: { [key: string]: number } = {};
  const areaData = areasToCreate[0]; // 只有一个 nsd 区域

  try {
    const response = await createArea(areaData);
    const areaId = response.id || response.areaId;
    
    if (areaId) {
      map[areaData.name] = areaId;
      areaCreationStatus.value.push({
        name: areaData.name,
        success: true,
        message: `创建成功，ID: ${areaId}`,
      });
      areaIdMap.value = map;
    } else {
      throw new Error('API 返回中未找到区域 ID');
    }
  } catch (error: any) {
    const message = error.message || (error.data && error.data.message) || '未知错误';
    areaCreationStatus.value.push({
      name: areaData.name,
      success: false,
      message: `创建失败: ${message}`,
    });
    areaIdMap.value = null;
  }
  isCreatingAreas.value = false;
  loadAreas(); // 创建后重新加载区域列表
}

/**
 * 批量创建座位
 */
async function batchCreateSeats() {
  if (!areaIdMap.value || !areaIdMap.value['nsd']) {
    seatCreationMessage.value = '请先成功创建 nsd 区域。';
    seatCreationSuccess.value = false;
    return;
  }

  isCreatingSeats.value = true;
  seatCreationMessage.value = '';
  seatCreationSuccess.value = false;

  try {
    const nsdAreaId = areaIdMap.value['nsd'];
    const backendSeats = convertFrontendConfigToBackendSeats(nsdAreaId);
    
    const seatsData = {
      seats: backendSeats,
    };

    await apiBatchCreateSeats(seatsData);

    seatCreationMessage.value = `成功批量创建 ${backendSeats.length} 个座位！`;
    seatCreationSuccess.value = true;
  } catch (error: any) {
    const message = error.message || (error.data && error.data.message) || '未知错误';
    seatCreationMessage.value = `批量创建座位失败: ${message}`;
    seatCreationSuccess.value = false;
    console.error('批量创建座位失败:', error);
  } finally {
    isCreatingSeats.value = false;
  }
}
</script>
