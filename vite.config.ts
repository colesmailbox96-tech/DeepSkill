import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise the warning threshold — the game bundle is intentionally large
    // due to Three.js and inline engine data.  Further splitting is tracked
    // in the expansion backlog (systems_hardening bucket).
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Vendor chunk: separate Three.js from the app so the browser can
        // cache it independently between deploys.
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react'
        },
      },
    },
  },
})
