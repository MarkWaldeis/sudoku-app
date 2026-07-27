import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/sudoku-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      includeAssets: ['favicon.ico', 'mascot.jpg', 'mascot_fox.jpg', 'mascot_king.jpg', 'mascot_ninja.jpg'],
      manifest: {
        name: 'Duolingo Sudoku',
        short_name: 'Sudoku',
        description: 'Gamified Duolingo-style Sudoku PWA',
        theme_color: '#58cc02',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'mascot.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'mascot.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
