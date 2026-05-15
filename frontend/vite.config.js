import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages base path — matches the repo name "CHINTU"
// Locally this falls back to '/'
const base = process.env.VITE_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/CHINTU/' : '/')

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws':  { target: 'ws://localhost:8000', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
