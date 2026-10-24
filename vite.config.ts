import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the same build works on Cloudflare Pages (root) and GitHub Pages (/repo/).
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      // 'prompt': a new version waits until src/pwa.ts applies it at a calm moment.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Wunderfrage',
        short_name: 'Wunderfrage',
        description: 'A talking quiz game for curious kids. Works offline, no ads.',
        lang: 'de',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        background_color: '#fff6e9',
        theme_color: '#ffb347',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything, including the lazily loaded question bank chunks.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
