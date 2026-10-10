import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Keep local development private by default. For remote access over a VPN,
    // set VITE_DEV_HOST to this computer's VPN IP address.
    host: process.env.VITE_DEV_HOST?.trim() || '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: proxy => {
          // API calls are same-origin through Vite, so PHP session cookies
          // work for both local and VPN-connected browsers.
          proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin'))
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
