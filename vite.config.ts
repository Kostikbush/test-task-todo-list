import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              debugName: 'vendor-libraries',
              name(id) {
                if (!id.includes('node_modules')) return null
                if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
                if (/[\\/](@mantine|@floating-ui)[\\/]/.test(id)) return 'ui'
                if (/[\\/](effector|effector-react|zod)[\\/]/.test(id)) return 'state'
                return null
              },
            },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Flowday — пространство для важного',
        short_name: 'Flowday',
        description: 'Задачи, проекты и фокус в одном спокойном пространстве',
        theme_color: '#277966',
        background_color: '#f7f8fa',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'ru',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
