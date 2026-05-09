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
          if (id.includes('node_modules')) {
            if (id.includes('phaser')) return 'phaser';
            if (
              id.includes('@solana') ||
              id.includes('@walletconnect') ||
              id.includes('@web3auth') ||
              id.includes('@toruslabs') ||
              id.includes('@reown') ||
              id.includes('@solana-mobile')
            ) {
              return 'solana';
            }
            if (id.includes('react') || id.includes('zustand') || id.includes('mitt')) {
              return 'react-vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
});
