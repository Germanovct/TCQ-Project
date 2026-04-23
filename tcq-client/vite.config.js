import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tcq-icon.svg'],
      manifest: {
        name: 'TCQ Club',
        short_name: 'TCQ',
        description: 'Billetera Cashless TCQ Club',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        icons: [
          {
            src: 'tcq-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'tcq-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
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
