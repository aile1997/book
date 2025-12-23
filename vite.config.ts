import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 支持HTTPS开发服务器
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://111.229.50.3/',
        changeOrigin: true,
        secure: false, // 对于自签名证书的开发环境设为false
        rewrite: (path) => path,
      },
    },
  },
})
