import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-term cacheable vendor chunks, separate from app code
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/, priority: 20 },
            { name: 'charts', test: /node_modules[\/](recharts|d3-[a-z-]+|victory-vendor|internmap|decimal.js-light|es-toolkit)[\/]/, priority: 15 },
            { name: 'vendor', test: /node_modules/, priority: 10 },
          ],
        },
      },
    },
  },
})
