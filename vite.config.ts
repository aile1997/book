import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  base: '/book/', // 必须以斜杠开始和结束

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 支持HTTPS开发服务器
    // host: '192.168.10.115',
    proxy: {
      '/api': {
        target: 'https://continuate-unsanguinely-hui.ngrok-free.dev',
        changeOrigin: true,
        secure: false, // 对于自签名证书的开发环境设为false
        rewrite: (path) => path.replace(/^\/api/, '/'), // 根据你的路由调整
      },
    },
  },
})
