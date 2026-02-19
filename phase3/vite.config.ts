import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - matches repo name
  base: '/global-viz/',
  server: {
    port: 5174,
    watch: {
      usePolling: true,  // Required for hot reload over SSH
    },
  },
})
