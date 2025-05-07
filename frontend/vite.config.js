import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允許外部連線
    port: 5173, // dev server 埠號
    strictPort: true,
    // 加上 ngrok domain 到 allowedHosts
    allowedHosts: [
      '6601-61-220-233-9.ngrok-free.app'
    ],
    // 如果要讓 HMR 也能透過 ngrok 正確連線，可加下面設定
    // 前端port 5173
    hmr: {
      protocol: 'wss',
      host: 'bfa7-61-220-233-9.ngrok-free.app',
    }
  }
})
