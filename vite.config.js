import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3000',
    }
  },
  build: {
    outDir: 'build'
  },

  // Converts absolute imports to relative paths
  resolve: {
    alias: {
      'src': '/src'
    }
  }
})