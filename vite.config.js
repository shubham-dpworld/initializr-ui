// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/metadata': 'http://localhost:8080',
      '/dependencies': 'http://localhost:8080',
      '/starter.zip': 'http://localhost:8080',
      '/starter.tgz': 'http://localhost:8080'
    }
  }
})
