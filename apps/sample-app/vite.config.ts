import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { rpcPlugin } from './build/vite-rpc-plugin.js';

export default defineConfig({
  plugins: [react(), rpcPlugin()],
  root: 'src/client',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Proxy RPC calls to our backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  resolve: {
    alias: {
      // Allow client to resolve server types for TypeScript
      '@server': path.resolve(__dirname, 'src/server'),
    }
  }
});