import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Strict Content-Security-Policy, injected only into the production build.
// The dev server is intentionally excluded so HMR / react-refresh keep working.
// style-src needs 'unsafe-inline' because components use React inline styles;
// script-src stays locked to 'self' (all bundles are external files).
const CSP_CONTENT = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const injectCsp = (): Plugin => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP_CONTENT}" />`
    )
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/sudoku-app/',
  plugins: [
    react(),
    injectCsp(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
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
            type: 'image/jpeg',
          },
          {
            src: 'mascot.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
    }),
  ],
})
