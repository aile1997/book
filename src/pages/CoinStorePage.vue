<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const products = [
  { id: 1, name: 'Product Name', description: 'Description', price: 100 },
  { id: 2, name: 'Product Name', description: 'Description', price: 100 },
  { id: 3, name: 'Product Name', description: 'Description', price: 100 },
]

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <div class="flex items-center justify-center px-6 py-6 relative border-b border-gray-light">
      <button
        @click="goBack"
        class="absolute left-6 flex items-center justify-center w-6 h-6"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 19.9201L8.47997 13.4001C7.70997 12.6301 7.70997 11.3701 8.47997 10.6001L15 4.08008"
            stroke="#292D32"
            stroke-width="1.5"
            stroke-miterlimit="10"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <h1 class="text-xl font-medium text-black text-center">Coin Store</h1>
    </div>

    <!-- Products -->
    <div class="px-8 py-6 space-y-6">
      <div
        v-for="product in products"
        :key="product.id"
        class="space-y-4"
      >
        <div class="w-full h-40 bg-gray-light rounded-[10px]"></div>
        
        <div class="flex items-end justify-between">
          <div>
            <h3 class="text-base font-medium text-black mb-1">{{ product.name }}</h3>
            <p class="text-sm font-medium text-gray-lighter">{{ product.description }}</p>
            
            <div class="flex items-center gap-1 mt-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.58333 0C4.29333 0 0 4.29333 0 9.58333C0 14.8733 4.29333 19.1667 9.58333 19.1667C14.8733 19.1667 19.1667 14.8733 19.1667 9.58333C19.1667 4.29333 14.8733 0 9.58333 0ZM13.1771 8.86458C13.57 8.86458 13.8958 9.19042 13.8958 9.58333C13.8958 9.97625 13.57 10.3021 13.1771 10.3021H6.22917V10.5417C6.22917 11.73 7.19708 12.6979 8.38542 12.6979H13.1771C13.57 12.6979 13.8958 13.0237 13.8958 13.4167C13.8958 13.8096 13.57 14.1354 13.1771 14.1354H8.38542C6.40167 14.1354 4.79167 12.5254 4.79167 10.5417V8.625C4.79167 6.64125 6.40167 5.03125 8.38542 5.03125H13.1771C13.57 5.03125 13.8958 5.35708 13.8958 5.75C13.8958 6.14292 13.57 6.46875 13.1771 6.46875H8.38542C7.19708 6.46875 6.22917 7.43667 6.22917 8.625V8.86458H13.1771Z"
                  fill="#292929"
                />
              </svg>
              <span class="text-xl font-semibold text-gray-dark">{{ product.price }}</span>
            </div>
          </div>
          
          <button class="px-4 py-2.5 bg-cyan text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
