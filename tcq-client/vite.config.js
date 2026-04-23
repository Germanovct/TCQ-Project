import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tcqlogo.jpg'],
      manifest: {
        name: 'TCQ Club',
        short_name: 'TCQ',
        description: 'Billetera Cashless TCQ Club',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        icons: [
          {
            src: 'tcqlogo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'tcqlogo.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
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
