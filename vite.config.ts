import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/apple-touch-icon.png', 'assets/favicon.png'],
      manifest: {
        name: 'Quest Cat',
        short_name: 'Quest Cat',
        description: 'A gamified daily quest board for your tasks and long-term goals.',
        theme_color: '#102532',
        background_color: '#102532',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/assets/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/assets/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          }
        ]
      }
    })
  ]
});
