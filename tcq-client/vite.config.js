import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tcqlogo.jpg', 'tcq-192.png', 'tcq-512.png'],
      manifest: {
        name: 'TCQ Club',
        short_name: 'TCQ',
        description: 'Billetera Cashless TCQ Club',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        icons: [
          {
            src: 'tcq-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'tcq-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'tcq-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3001,
    host: true,
  }
})
