import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mysten')) return 'sui';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('react') || id.includes('zustand') || id.includes('zod')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});
