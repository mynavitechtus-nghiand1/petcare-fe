import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Browser gọi /api/... → Vite forward lên backend thật
      // CORS không xảy ra vì request xuất phát từ server (Vite), không phải browser
      '/api': {
        target: 'https://petcare-be-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
