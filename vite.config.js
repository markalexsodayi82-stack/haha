import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'node:fs';

let backendPort = process.env.AQUAFLOW_BACKEND_PORT || '8080';
try {
  if (!process.env.AQUAFLOW_BACKEND_PORT && existsSync('.aquaflow-port')) {
    backendPort = readFileSync('.aquaflow-port', 'utf8').trim() || '8080';
  }
} catch {}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: { '/api': { target: `http://127.0.0.1:${backendPort}`, changeOrigin: true } }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false
  }
});
