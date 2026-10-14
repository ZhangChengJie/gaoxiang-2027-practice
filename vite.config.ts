import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
const buildTime = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const appVersion = `${buildTime.getFullYear()}.${pad(buildTime.getMonth() + 1)}.${pad(buildTime.getDate())}-${pad(buildTime.getHours())}${pad(buildTime.getMinutes())}`

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  plugins: [
    react(),
    VitePWA({
      // 新版本下载后立即接管（skipWaiting + clientsClaim），由 UpdatePrompt 提示用户点击刷新；
      // 注册放在应用代码里，以便主动检查更新
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '高项二轮练习 · 2027',
        short_name: '高项练习',
        description: '软考高项备考练习平台',
        theme_color: '#07C160',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gaoxiang-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom' },
})
