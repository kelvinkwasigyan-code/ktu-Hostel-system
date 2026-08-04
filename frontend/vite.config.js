import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'KTU Housing Portal',
        short_name: 'KTU Housing',
        description: 'Official Student Housing Platform for Koforidua Technical University',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        icons: [
          {
            src: '/ktu-logo.png', // Assuming logo exists
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/ktu-logo.png', // Assuming logo exists
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 30000,
        timeout: 30000,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group heavy packages into separate chunks
            if (id.includes('mapbox-gl')) return 'mapbox';
            if (id.includes('supabase')) return 'supabase';
            if (id.includes('lucide-react') || id.includes('react-icons')) return 'icons';
            
            // Put all other third-party dependencies into a vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
});
