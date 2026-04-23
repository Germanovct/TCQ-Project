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
        name: 'TCQ POS',
        short_name: 'TCQ POS',
        description: 'Sistema de punto de venta TCQ Club',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
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
})
