import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const createProxyConfig = (target: string) => ({
  target,
  changeOrigin: true,
  secure: false,
  timeout: 20000,
  proxyTimeout: 20000,
  configure: (proxy: any) => {
    proxy.on('error', (err: any, req: any, res: any) => {
      console.warn(`[Vite Proxy Error] ${req?.url || ''} -> ${target}: ${err?.code || err?.message || err}`);
      if (res && !res.headersSent && typeof res.writeHead === 'function') {
        try {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Proxy Gateway Error', code: err?.code || 'PROXY_ERROR' }));
        } catch {
          // Ignore if connection already terminated
        }
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    cors: true,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: false,
    },
    proxy: {
      '/lmd/prfsrv': createProxyConfig('https://production-api.fleet.lmdmax.com'),
      '/lmd/twms': createProxyConfig('https://betastaging-messaging.fleet.lmdmax.com'),
      '/extract': createProxyConfig('https://production-fastapi.fleet.lmdmax.com'),
      '/lmd/schsrv': createProxyConfig('https://betastaging-api.fleet.lmdmax.com'),
      '/lmd': createProxyConfig('https://production-api.fleet.lmdmax.com'),
      '/aiproxy': createProxyConfig('https://staging-api.fleet.lmdmax.com'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'axios',
      'zustand',
      '@tanstack/react-query',
    ],
  },
})
