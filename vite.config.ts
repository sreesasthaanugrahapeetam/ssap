import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/favicon.png'],
      manifest: {
        id: '/admin/',
        name: 'Peetam Admin',
        short_name: 'Peetam Admin',
        description: 'Sree Sastha Anugraha Peetam admin',
        start_url: '/admin/',
        scope: '/admin/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0C0400',
        theme_color: '#0C0400',
        icons: [
          { src: '/assets/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/assets/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,woff2}'],
        globIgnores: ['**/pwa-512.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/(sitemap\.xml|robots\.txt)$/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
})
