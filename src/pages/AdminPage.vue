<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">管理员界面 - 座位初始化</h1>

    <section class="mb-8 p-4 border rounded-lg shadow-sm">
      <h2 class="text-xl font-semibold mb-4">1. 创建区域 (A, B, C)</h2>
      <button
        @click="createAreas"
        :disabled="isCreatingAreas"
        class="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
      >
        {{ isCreatingAreas ? '创建中...' : '创建 A, B, C 区域' }}
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
import { ref } from 'vue';
import { createArea, batchCreateSeats as apiBatchCreateSeats } from '../api';
import { convertFrontendConfigToBackendAreas, convertFrontendConfigToBackendSeats } from '../utils/dataAdapter';

// 状态
const isCreatingAreas = ref(false);
const areaCreationStatus = ref<{ name: string; success: boolean; message: string }[]>([]);
const areaIdMap = ref<{ [key: string]: number } | null>(null);

const isCreatingSeats = ref(false);
const seatCreationMessage = ref('');
const seatCreationSuccess = ref(false);

/**
 * 创建区域 A, B, C
 */
async function createAreas() {
  isCreatingAreas.value = true;
  areaCreationStatus.value = [];
  areaIdMap.value = {};

  const areasToCreate = convertFrontendConfigToBackendAreas();
  const map: { [key: string]: number } = {};

  for (const areaData of areasToCreate) {
    try {
      // 假设 createArea 返回 { id: number, name: string }
      const response = await createArea(areaData);
      const areaId = response.id || response.areaId; // 尝试从不同字段获取 ID
      
      if (areaId) {
        map[areaData.name] = areaId;
        areaCreationStatus.value.push({
          name: areaData.name,
          success: true,
          message: `创建成功，ID: ${areaId}`,
        });
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
    }
  }

  if (Object.keys(map).length === areasToCreate.length) {
    areaIdMap.value = map;
  } else {
    areaIdMap.value = null;
  }
  isCreatingAreas.value = false;
}

/**
 * 批量创建座位
 */
async function batchCreateSeats() {
  if (!areaIdMap.value) {
    seatCreationMessage.value = '请先成功创建区域。';
    seatCreationSuccess.value = false;
    return;
  }

  isCreatingSeats.value = true;
  seatCreationMessage.value = '';
  seatCreationSuccess.value = false;

  try {
    const backendSeats = convertFrontendConfigToBackendSeats(areaIdMap.value);
    
    // 构造批量创建的请求体
    const seatsData = {
      seats: backendSeats,
    };

    // 调用批量创建 API
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
