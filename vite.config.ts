import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/cgi-bin': {
        target: 'https://texlive.net',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy Error (/cgi-bin):', err);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log('Proxying Request (/cgi-bin):', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Proxy Received Response (/cgi-bin):', proxyRes.statusCode, req.url);
            if (proxyRes.headers.location) {
              console.log('Proxy Redirect Location:', proxyRes.headers.location);
            }
          });
        }
      },
      '/latexcgi': {
        target: 'https://texlive.net',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy Error (/latexcgi):', err);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log('Proxying Request (/latexcgi):', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Proxy Received Response (/latexcgi):', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
