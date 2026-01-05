import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  define: {
    // 每次 build 时，__APP_VERSION__ 都会变成当前时间戳
    __APP_VERSION__: JSON.stringify(Date.now().toString()),
  },
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 支持HTTPS开发服务器
    host: '0.0.0.0',
    allowedHosts: [
      '5174-i7748nih6rz8vss6c2dq7-a9053546.manusvm.computer',
      '127.0.0.1',
      'localhost',
    ],
    proxy: {
      '/api': {
        target: 'http://111.229.50.3:8080/',
        changeOrigin: true,
        secure: false, // 对于自签名证书的开发环境设为false
        rewrite: (path) => path,
      },
    },
  },
})
