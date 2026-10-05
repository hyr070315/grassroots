import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    // 允许跨域（供摄像头/接口等场景）
    cors: true,
    // 若后端独立部署，可在此配置代理解决跨域
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  },
  build: {
    // 模型文件无需压缩，直接透传
    assetsInlineLimit: 0
  },
  optimizeDeps: {
    // 避免 onnxruntime-web 被预构建导致 worker/wasm 路径异常
    exclude: ['onnxruntime-web']
  }
})