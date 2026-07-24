import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
