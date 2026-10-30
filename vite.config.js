import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['apple-touch-icon.png'],
    manifest: {
      name: 'Lịch học · Tuần của bạn', short_name: 'Lịch học', lang: 'vi',
      description: 'Thời khóa biểu từ thứ Hai đến thứ Sáu',
      theme_color: '#f2f2f7', background_color: '#f2f2f7',
      display: 'standalone', start_url: './', scope: './',
      icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'], navigateFallback: 'index.html' },
  })],
});
